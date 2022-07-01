use crate::utils::{ parse_rule_list, download_file, read_manifest_inherit };
use crate::vanilla::get_vanilla_versions;
use crate::natives::{ extract_natives_file, get_natives, extract_native_file };
use crate::expections::{ LauncherLibError, LibResult };
use crate::runtime::{ install_jvm_runtime, does_runtime_exist };
use crate::json::{
    launcher_version::VersionsManifestVersion,
    game_settings::GameOptions,
    install::{Library,VersionManifest, Event}
};
use std::env::consts;
use std::path::PathBuf;
use futures::StreamExt;
use tokio::fs::{read_to_string, create_dir_all, remove_dir, remove_file };
use log::{ error, info };
use serde::Deserialize;

///
/// 1. File path 
/// 2. Download url
pub fn parse_java_dep(name: String, url: Option<String>) -> Result<(String,String),LauncherLibError> {
    let data = name.split(":").collect::<Vec<&str>>();
    if data.len() < 3 {
        return Err(LauncherLibError::General("Missing required params in library name".to_string()));
    }
    let path = data[0];
    let n = data[1];
    let version = match data.get(2..data.len()) {
        Some(value) => value.join("-"),
        None => return Err(LauncherLibError::General("Java lib does not contain any strings".into()))
    };

    let version_full = format!("{}-{}.jar",n,version);

    let mut outpath = path.split(".").collect::<Vec<&str>>().join("/");
    outpath.push_str(format!("/{}",n).as_str());
    outpath.push_str(format!("/{}",version).as_str());
    outpath.push_str(format!("/{}",version_full).as_str());

    let mut download_url = url.unwrap_or("https://libraries.minecraft.net/".to_string());
    download_url.push_str(outpath.as_str());

    Ok((outpath,download_url))
}

pub fn parse_java_dep_native(name: String, url: Option<String>, native: String) -> Result<(String,String),LauncherLibError> {
    let data = name.split(":").collect::<Vec<&str>>();
    if data.len() < 3 {
        return Err(LauncherLibError::General("Missing required params".to_string()));
    }
    let path = data[0];
    let n = data[1];
    let version = match data.get(2..data.len()) {
        Some(value) => value.join("-"),
        None => return Err(LauncherLibError::General("Java lib does not contain any strings".into()))
    };

    let version_full = format!("{}-{}-{}.jar",n,version,native);

    let mut outpath = path.split(".").collect::<Vec<&str>>().join("/");
    outpath.push_str(format!("/{}",n).as_str());
    outpath.push_str(format!("/{}",version).as_str());
    outpath.push_str(format!("/{}",version_full).as_str());

    let mut download_url = url.unwrap_or("https://libraries.minecraft.net/".to_string());
    download_url.push_str(outpath.as_str());

    Ok((outpath,download_url))
}

pub async fn install_libraries(id: String, libraries: &Vec<Library>, path: PathBuf, callback: &impl Fn(Event)) -> LibResult<()> {

    // check rules
    // if lib does not have download artifacts 
    //
    // 1. parse name for path and name
    // 2. download file
    // 
    // or 
    //
    // download file
    // 
    let lib_path = path.join("libraries");
    let count = libraries.len();
    
    let files = futures::stream::iter(
        libraries.clone().into_iter().enumerate().map(|(idx, lib)|{
            let root = path.clone();
            let out = lib_path.clone();
            let uid = id.clone();
            async move {
                if let Some(rules) = &lib.rules {
                    if !parse_rule_list(&rules, &mut GameOptions::default()) {
                        callback(Event::progress(idx, count));
                        return ();
                    }
                }

                let native = get_natives(&lib);

                // if download
                if let Some(download) = &lib.downloads {
                    let download_path = download.artifact.path.clone().expect("Expected to have path prop");
                    
                    if download_path.contains("x86") && consts::ARCH != "x86" {
                        info!("Ingore x86 on {}",consts::ARCH);
                        return ();
                    }

                    let is_native = download_path.contains("natives");

                    if let Err(err) = download_file(download.artifact.url.clone(), out.join(download_path.clone()), callback, Some(download.artifact.sha1.clone()), false).await {
                        error!("{}",err);
                        return ();
                    }

                    // old natives check pre 1.19
                    if !native.is_empty() {
                        if let Some(classifiers) = &download.classifiers {
                            if let Some(nat) = classifiers.get(&native) {
                                let native_path = out.join(nat.path.clone().expect("Failed to get classifiers native path"));

                                if let Err(err) = download_file(nat.url.clone(), native_path.clone(), callback, Some(nat.sha1.clone()), false).await {
                                    error!("{}",err);
                                    return ();
                                }

                                if let Some(extract) = &lib.extract {
                                    if let Err(err) = extract_natives_file(native_path, &root.join("versions").join(uid.clone()).join("natives"), &extract) {
                                        error!("{}",err);
                                        return ();
                                    }
                                }
                            }
                        }
                    }  

                    // new natives check
                    if is_native {
                        if let Err(err) = extract_native_file(&out.join(download_path), &root.join("versions").join(uid.clone()).join("natives")) {
                           error!("{}",err);
                        }
                    }

                } else {
                    // if no downloads
                    // this is mostly for fabric and OptiFine installs
                    // forge should have a downloads prop 
                    let (path,url) = match parse_java_dep(lib.name.clone(),lib.url.clone()) {
                        Ok(value) => value,
                        Err(_err) => return ()
                    };

                    if let Err(err) = download_file(url, out.join(path), callback, None, false).await {
                        error!("{}",err);
                    }

                    let (nat_path,_nat_url) = match parse_java_dep_native(lib.name.clone(), lib.url.clone(), native.clone()) {
                        Ok(value) => value,
                        Err(err) => {
                            error!("{}",err);
                            return ();
                        }
                    };
                    // old natives check
                    if !native.is_empty() {
                        if let Some(extract) = &lib.extract {
                            if let Err(err) = extract_natives_file(root.join(nat_path), &root.join("versions").join(uid.clone()).join("natives"), &extract) {
                                error!("{}",err);
                                return ();
                            }
                        }
                    }

                }
                callback(Event::progress(idx,count ));
                ()
            }
        })
    ).buffer_unordered(8).collect::<Vec<()>>();

   files.await;

    Ok(())
}

#[derive(Deserialize)]
struct IndexAssetsItem {
    hash: String,
    //size: usize
}
#[derive(Deserialize)]
struct IndexAssetsMap {
    objects: std::collections::HashMap<String,IndexAssetsItem>
}

async fn install_assets(manifest: &VersionManifest, path: PathBuf, callback: &impl Fn(Event)) -> LibResult<()> {

    let assets = match &manifest.assets {
        Some(value) => value,
        None => return Err(LauncherLibError::General("Assets key in manifest is missing".into()))
    };

    let index_path = path.join("assets").join("indexes").join(format!("{}.json",assets));
    if let Some(asset_index) = &manifest.asset_index {
        if let Err(err) = download_file(asset_index.url.clone(), index_path.clone(), callback, Some(asset_index.sha1.clone()), false).await {
            return Err(err);
        }

        let assets: IndexAssetsMap = match read_to_string(index_path).await {
            Ok(raw) => {
                match serde_json::from_str::<IndexAssetsMap>(&raw) {
                    Ok(value) => value,
                    Err(err) => return Err(LauncherLibError::ParseJsonSerde(err))
                }
            }
            Err(err) => return Err(LauncherLibError::OS {
                source: err,
                msg: "Failed to read file".into()
            })
        };

        // See https://patshaughnessy.net/2020/1/20/downloading-100000-files-using-async-rust

        let max = assets.objects.len();
        let requests = futures::stream::iter(
            assets.objects.into_iter().enumerate().map(|(idx,(key,value))| {
                let out = path.clone();
                async move {
                    callback(Event::Status(format!("Asset: {}",key)));
                    let pre = value.hash.get(0..2).expect("Should have this value");
                    let url = format!("https://resources.download.minecraft.net/{}/{}",pre,value.hash.clone());
                    let outpath = out.join("assets").join("objects").join(pre).join(value.hash.clone());
                    if let Err(err) = download_file(url, outpath, callback, Some(value.hash.clone()), false).await {
                        error!("{}",err);
                        callback(Event::Error(err.to_string()));
                    }
                    callback(Event::progress(idx,max));
                }
            })
        ).buffer_unordered(8).collect::<Vec<()>>();

        requests.await;
    } 

    Ok(())
}

async fn do_version_install(version_id: String, path: PathBuf, callback: &impl Fn(Event), url: Option<String>) -> LibResult<()> {

    let version_manifest = path.join("versions").join(version_id.clone()).join(format!("{}.json",version_id.clone()));
    callback(Event::Status("Getting version.json file".into()));
    if let Some(url_d) = url {
        if let Err(err) = download_file(url_d, version_manifest.clone(), callback, None, false).await {
            return Err(err);
        }
    }

    let manifest: VersionManifest = match read_manifest_inherit(version_manifest,&path).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    callback(Event::Status("Installing libraries".into()));
    if let Err(err) = install_libraries(manifest.id.clone(), &manifest.libraries, path.clone(),callback).await {
        return Err(err);
    }

    callback(Event::Status("Installing Assets".into()));
    if let Err(err) = install_assets(&manifest, path.clone(), callback).await {
        return Err(err);
    }   

    if let Some(logging) = manifest.logging {
        callback(Event::Status("Setting up logging".into()));
        if let Some(client) = logging.get("client") {
            if let Some(id) = &client.file.id {
                let logging_file = path.join("assets").join("log_configs").join(id);
                if let Err(err) = download_file(client.file.url.clone(), logging_file, callback, Some(client.file.sha1.clone()), false).await {
                    return Err(err);
                }
            }
        }
    }

    if let Some(downloads) = manifest.downloads {
        callback(Event::Status("Downloading Client jar".into()));
        if let Some(client) = downloads.get("client") {
            if let Err(err) = download_file(client.url.clone(), path.join("versions").join(manifest.id.clone()).join(format!("{}.jar",manifest.id.clone())), callback, Some(client.sha1.clone()), false).await {
                return Err(err);
            }
        }
    }

    if let Some(java) = manifest.java_version {
        callback(Event::Status("Installing java runtime".into()));
        match does_runtime_exist(java.component.clone(), path.clone()) {
            Ok(value) => {
                if !value {
                    if let Err(err) = install_jvm_runtime(java.component, path, callback).await {
                        return Err(err);
                    }
                }
            }
            Err(err) => return Err(err)
        }
    }
    Ok(())
}

pub async fn install_minecraft_version(version_id: String, mc_dir: PathBuf, callback: &impl Fn(Event)) -> LibResult<()> {
    if mc_dir.join("versions").join(version_id.clone()).join(format!("{}.json",version_id)).is_file() {
        return do_version_install(version_id, mc_dir, callback, None).await;
    }
    match get_vanilla_versions().await {
        Ok(versions) => {

            let version: Vec<&VersionsManifestVersion> = versions.iter().filter(| item | item.id == version_id).collect();

            if let Some(item) = version.get(0) {
                return do_version_install(item.id.clone(), mc_dir, callback, Some(item.url.clone())).await;
            }

            Ok(())
        }
        Err(err) => Err(err)
    }
}

pub async fn swap_mods_folder(profile: String, game_dir: PathBuf) -> LibResult<()> {

    let dir = game_dir.clone().join("system_mods").join(profile);
    let mod_dir = game_dir.join("mods");
    
    if !dir.is_dir() {
        if let Err(err) = create_dir_all(dir.clone()).await {
            return Err(LauncherLibError::OS { msg: "Failed to create system mods directory".into(), source: err });
        }
    }

    if mod_dir.exists() {
        if let Err(err) = remove_dir(mod_dir.clone()).await {
            return Err(LauncherLibError::OS { msg: "Failed to remove mods link".into(), source: err });
        }
    }

    // can't create a symlink on windows without admin, this should work, needs testing
    #[cfg(windows)]
    {
        use tokio::process::Command;

        if let Err(err) = Command::new("powershell").args(
            ["New-Item","-ItemType","Junction","-Path",mod_dir.to_str().expect("Failed to make str"),"-Target",dir.to_str().expect("Failed to make str"),"-WindowStyle","Hidden"]
        ).output().await {
            return Err(LauncherLibError::OS { msg: "Failed to create link".into(), source: err });
        }
    }

    #[cfg(not(windows))]
    {
        use tokio::fs::symlink_dir;

        if let Err(err) = symlink_dir(src, dst).await {
            return Err(LauncherLibError::OS { msg: "Failed to create link".into(), source: err });
        }
    }
  

    Ok(())
}

#[derive(Deserialize)]
pub struct Mod {
    name: String,
    version: String,
    uuid: String,
    url: String,
    sha1: String
}

//https://patshaughnessy.net/2020/1/20/downloading-100000-files-using-async-rust
pub async fn install_mods(profile: String, game_dir: PathBuf, mods: Vec<Mod>, callback: &impl Fn(Event)) -> LibResult<()> {

    let outdir = game_dir.join("system_mods").join(profile);

    let max = mods.len();
    let mut idx = 0;

    callback(Event::Status("Downloading Mods".into()));
    callback(Event::Progress { max, current: 0 });

    let fetches = futures::stream::iter(
        mods.into_iter().map(|item|{
            let dir = outdir.clone();
            async move {
                let file = dir.join(format!("{}-({}-{}).jar",item.uuid,item.name,item.version));
                if let Err(err) = download_file(item.url, file, callback, Some(item.sha1), false).await {
                    return Err(err);
                }

                idx += 1;
                callback(Event::Progress { max, current: idx });

                Ok(())
            }
        })
    ).buffer_unordered(8).collect::<Vec<LibResult<()>>>();

    fetches.await;

    Ok(())
}

pub async fn update_mods(profile: String, game_dir: PathBuf, mods: Vec<Mod>,  callback: &impl Fn(Event)) -> LibResult<()> {
    let profile_dir = game_dir.join("system_mods").join(profile.clone());

    if profile_dir.is_dir() {
        let dir = match profile_dir.read_dir() {
            Ok(value) => value.into_iter(),
            Err(err) => return Err(LauncherLibError::OS { msg: "Failed to read mods directory".into(), source: err })
        };

        let max = mods.len();
        let mut idx = 0;

        callback(Event::Status("Removing old files".into()));
        callback(Event::Progress { max, current: 0 });
    
        for file in dir {
            match file {
                Ok(value) => {
                    let file_name = value.file_name().into_string().expect("Failed to get file name");
                    for i in &mods {
                        if !file_name.starts_with(&i.uuid) {
                            continue;
                        }
                        if let Err(err) = remove_file(value.path()).await {
                            return Err(LauncherLibError::OS { msg: "Failed to remove file".into(), source: err })
                        }
                        idx += 1;
                        callback(Event::Progress { max, current: idx });
                    }
                }
                Err(err) => {
                    error!("{}",err);
                }
            }
        }
    }

    if let Err(err) = install_mods(profile,game_dir,mods,callback).await { 
        return Err(err); 
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::utils::get_minecraft_directory;
    use log::{error,info};

    fn init_logger(){
       let _ = env_logger::builder().filter_level(log::LevelFilter::Trace).is_test(true).try_init();
    }

    #[tokio::test]
    async fn test_update_mods() {
        init_logger();
        let mc = get_minecraft_directory().expect("Failed to get mc dir");
        let profile = "d3b7c726-f461-4d58-9e04-14ab2b9b6380".to_string();
        let mods: Vec<Mod> = vec![ Mod { 
            name: "Sodium".into(), 
            version: "0.4.2+build.16".into(), 
            url: "https://github.com/CaffeineMC/sodium-fabric/releases/download/mc1.19-0.4.2/sodium-fabric-mc1.19-0.4.2+build.16.jar".into(), 
            sha1: "6c1b055bce99d0bf64733e0ff95f347e4cd171f3".into(), 
            uuid: "cec101023728409abc947c4102204b01".into() 
        } ];


        if let Err(err) = update_mods(profile, mc, mods, &|e|{
            info!("{:#?}",e);
        }).await {
            error!("{}",err);
            panic!();
        }

    }
    
    #[tokio::test]
    async fn test_swap_system_mods(){
        let mc = get_minecraft_directory().expect("Failed to get mc dir");

        if let Err(err) = swap_mods_folder("889asdfedf".into(),mc).await {
            eprintln!("{}",err);
        }
    }

    #[test]
    fn test_parse_name(){
        match parse_java_dep("org.lwjgl:lwjgl-jemalloc:3.3.1".to_string(),None){
            Ok((path,url)) => {

                assert_eq!(path,"org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1.jar".to_string());
                assert_eq!(url,"https://libraries.minecraft.net/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1.jar".to_string());

            }
            Err(err) => {
                eprintln!("{}",err);
            }
        };


    }
}