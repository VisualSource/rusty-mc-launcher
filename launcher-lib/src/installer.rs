use std::path::PathBuf;
use std::env::consts;
use log::{debug, info, error};
use tokio::{fs, io};
use futures::StreamExt;
use sha1::{Digest,Sha1};
use tokio::io::AsyncWriteExt;
use std::borrow::BorrowMut;

use crate::manifest::{Manifest, RuleCondition, asset_index::AssetIndex, jvm};
use crate::errors::LauncherLibError;
use crate::metadata::get_launcher_manifest;

//https://www.reddit.com/r/rust/comments/gi2pld/callback_functions_the_right_way/
//https://github.com/lpxxn/rust-design-pattern/blob/master/behavioral/observer.rs
//https://github.com/tomsik68/mclauncher-api/wiki/Libraries
//https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master

const JVM_LIST: &str = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json"; 

struct Installer { 
    version: String,
    mc: String,
    game_dir: PathBuf
}

impl Installer {
    pub fn new(version: String, game_dir: PathBuf) -> Self {
        // parse version string
        Self {
            mc: version.clone(),
            version,
            game_dir
        }
    }
    
    async fn download_file(url: &String, dir: &PathBuf, sha1: &String) -> Result<(),LauncherLibError> {

        if let Some(p) = dir.parent() {
            if !p.exists() {
                fs::create_dir_all(&p).await?;
            }
        }  

        //https://github.com/seanmonstar/reqwest/issues/1266
        let mut response = reqwest::get(url).await?;
        let mut file = fs::File::create(&dir).await?;
        let mut hasher = Sha1::new();

        while let Some(mut chuck) = response.chunk().await? {
            hasher.update(&chuck);
            file.write_all_buf(chuck.borrow_mut()).await?;
        }

        file.shutdown().await?;

        //https://github.com/RustCrypto/hashes/issues/185
        let result = hex::encode(hasher.finalize());

        if &result != sha1 {
            return Err(LauncherLibError::Sha1Error);
        }

        Ok(())
    }

    pub async fn install_jvm(version: String, game_dir: &PathBuf) -> Result<(),LauncherLibError> {
        let manifest = reqwest::get(JVM_LIST).await?.json::<jvm::JvmManifest>().await?;

        let native = match consts::OS {
            "windows" => {
                if consts::ARCH == "x86" {
                    "windows-x86"
                } else {
                    "windows-x64"
                }
            }
            "linux" => {
                if consts::ARCH == "x86_64" {
                    "linux-i386"
                } else {
                    "linux"
                }
            }
            "macos" => {
                if consts::ARCH == "arm" {
                    "mac-os-arm64"
                } else {
                    "mac-os"
                }
            }
            _ => return Err(LauncherLibError::Generic("Current Platfrom is unsupported".to_string()))
        };

        let jvms = manifest.get(native).ok_or_else(||LauncherLibError::Generic("Failed to get jvm runtime native.".to_string()))?;
        let runtimes = jvms.get(&version).ok_or_else(||LauncherLibError::NotFound(format!("Jvm runtime ({}), could not be found",version)))?;
        let runtime = runtimes.first().ok_or_else(||LauncherLibError::Generic("Failed to get jvm manifest".to_string()))?;

        let jvm = reqwest::get(&runtime.manifest.url).await?.json::<jvm::JVMFiles>().await?;
        
        let base_path = game_dir.join(format!("runtime/{version}/{platform}/{version}",platform=native,version=runtime.version.name));

        let files = futures::stream::iter(
            jvm.files.iter().map(|(key,file)|{
                let base = base_path.clone();
                async move {
                    let current_path = base.join(key);

                    match file.file_type.as_str() {
                        "file" => {
                            let downloads = file.downloads.as_ref().ok_or_else(||LauncherLibError::Generic("Expected downloads".to_string()))?;

                            //https://github.com/Majored/rs-async-zip/blob/main/examples/actix_multipart.rs
                            if let Some(lzma) = &downloads.lzma {
                                let mut response = reqwest::get(&lzma.url).await?;
                                let mut archive = fs::File::create(&current_path).await?;
    
                                let mut writer = async_zip::write::ZipFileWriter::new(&mut archive);
    
                                let mut hasher = Sha1::new();   

                                let file_name = current_path.file_name().expect("Failed to convert filename to str.").to_str().expect("Failed to get file name").to_string();

                                let builder =  async_zip::ZipEntryBuilder::new(file_name, async_zip::Compression::Lzma);
                                let mut entry_writer = writer.write_entry_stream(builder).await.unwrap();
                        
                                while let Some(mut chunk) = response.chunk().await? {
                                    hasher.update(&chunk);
                                    entry_writer.write_all_buf(&mut chunk).await?;
                                }

                                let result = hex::encode(hasher.finalize());
                        
                                entry_writer.close().await?;
                                writer.close().await?;
                                archive.shutdown().await?;

                                if result != lzma.sha1 {
                                    return Err(LauncherLibError::Sha1Error);
                                }
                            } else {
                                Installer::download_file(&downloads.raw.url, &current_path, &downloads.raw.sha1).await?;
                            }
                        
                            /*if file.executable {
                                // make executable
                                fs::set_permissions(current_path, )
                            }*/
                        }
                        "directory" => {
                            fs::create_dir_all(&current_path).await?;
                        }
                        "link" => {
                            let target = file.target.as_ref().ok_or_else(||LauncherLibError::Generic("Expected Target".to_string()))?;

                            fs::symlink_file(current_path, target).await?;
                            // link target
                        }
                        _ => {}
                    }

                    Ok(())
                }
            })
        ).buffered(50).collect::<Vec<Result<(),LauncherLibError>>>();

        files.await.iter().for_each(|x|{
            if let Err(err) = x {
                error!("{}",err);
            }
        });

        let version_file = game_dir.join(format!("runtime/{}/{}/.version",runtime.version.name,native));

        if let Some(p) = version_file.parent() {
            if !p.exists() {
                fs::create_dir_all(&version_file).await?;
            }
        }

        fs::write(&version_file,runtime.version.name.as_bytes()).await?;

        Ok(())
    }

    pub async fn install(self) -> Result<(),LauncherLibError> {
        let launcher_manifest = get_launcher_manifest(Some(self.mc.clone())).await?;
        // .minecraft/versions/VERSION/VERSION.json
        let version_root = self.game_dir.join(format!("versions/{id}",id=launcher_manifest.id));
        let version_json = version_root.join(format!("{}.json",self.mc.clone()));
        let client_jar = version_root.join(format!("{}.jar",self.mc.clone()));

        // download json
        if !version_json.is_file() {
            info!("Downloading version json");
            Installer::download_file(&launcher_manifest.url, &version_json, &launcher_manifest.sha1).await?;
        }

        let manifest_raw = fs::read_to_string(&version_json).await?;
        let mut manifest = serde_json::from_str::<Manifest>(&manifest_raw)?;

        // do inherit stuff here
        if let Some(inherts) = &manifest.inherits_from {
            // Load base manifest
            let path = self.game_dir.join(format!("versions/{0}/{0}.json",inherts));
            let manifest_raw = fs::read_to_string(&path).await?;
            let base = serde_json::from_str::<Manifest>(&manifest_raw)?;

            manifest = manifest.inherit(base);
        }

        //client JAR
        if !client_jar.is_file() {
            if let Some(downloads) = manifest.downloads {
                debug!("{:#?}",downloads.client);
                Installer::download_file(&downloads.client.url,&client_jar, &downloads.client.sha1).await?;
            }
        }

        // libraries
        //https://patshaughnessy.net/2020/1/20/downloading-100000-files-using-async-rust
        let libs = futures::stream::iter(
            manifest.libraries.into_iter().map(|lib| {
                let game_dir = self.game_dir.clone();
                let id = manifest.id.clone();
                async move {
                    if let Some(rule) = lib.rules {
                        let allowed = rule.iter().map(|condition|{
                            match condition {
                                RuleCondition::Os { action, os } => {
                                    let active = os.iter().map(|(key,map_value)|{
                                        match key.as_str() {
                                            "name" => map_value.replace("osx", "macos") == consts::OS,
                                            "arch" => map_value == consts::ARCH,
                                            "version" => {
                                                if let Ok(re) = regex::Regex::new(&map_value) {
                                                    let os_version = os_info::get().version().to_string();
                                                    return re.is_match(&os_version);
                                                }
    
                                                false
                                            }
                                            _ => false
                                        }
                                    }).all(|x|x);
    
                                    (action == "allow" && active) || (action == "disallow" && !active)
                                }
                                _ => false
                            }
                        }).all(|x|x);

                        if !allowed {
                            return Ok(());
                        }
                    }

                    if let Some(downloads) = lib.downloads {

                        let path = downloads.artifact.path.ok_or_else(||LauncherLibError::Generic("Failed to get download path".to_string()))?;
                    
                        let output_file = game_dir.join(format!("libraries/{}",path));
                    
                        Installer::download_file(&downloads.artifact.url, &output_file, &downloads.artifact.sha1).await?;

                        if let Some(classifiers) = downloads.classifiers {
                            let natives_list = lib.natives.ok_or_else(||LauncherLibError::Generic("Failed to get natives strings".to_string()))?;
                            let os = if natives_list.contains_key("osx") && consts::OS == "macos" {
                                "osx"
                            } else {
                                consts::OS
                            };

                            if let Some(native_id) = natives_list.get(os) {
                                if let Some(file) = classifiers.get(native_id) {
                                    let path = file.path.as_ref().ok_or_else(||LauncherLibError::Generic("Failed to get download path".to_string()))?;
                                    let output_file = game_dir.join(format!("libraries/{}",path));
                              
                                    Installer::download_file(&file.url, &output_file,&file.sha1).await?;

                                    if let Some(extract) = lib.extract {
                                        let archive = fs::File::open(output_file).await?;
                                        let mut reader = async_zip::read::seek::ZipFileReader::new(archive).await?;

                                        let outdir = game_dir.join(format!("versions/{}/natives",id));

                                        if !outdir.exists() {
                                            fs::create_dir_all(&outdir).await?;
                                        }
                                        //https://github.com/Majored/rs-async-zip/blob/main/examples/file_extraction.rs
                                        for index in 0..reader.file().entries().len() {
                                            let entry = &reader.file().entries().get(index).unwrap().entry();
                                            let path = entry.filename().replace("\\", "/").split("/").map(sanitize_filename::sanitize).collect::<PathBuf>();

                                            if extract.exclude.contains(&path.to_str().expect("Failed to convent path buf").to_string()) {
                                                continue;
                                            }

                                            let entry_is_dir = entry.filename().ends_with('/');
                                            let full_output = game_dir.join(path);
                                            let mut entry_reader = reader.entry(index).await?;

                                            if entry_is_dir {
                                                if !full_output.exists() {
                                                    fs::create_dir_all(&full_output).await?;
                                                }
                                            } else {
                                                let parent = full_output.parent().expect("A file entry should have parent directories");
                                                if !parent.is_dir() {
                                                    fs::create_dir_all(parent).await?;
                                                }

                                                let mut writer = fs::File::create(&full_output).await?;
                                                io::copy(&mut entry_reader, &mut writer).await?;
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        return Ok(());
                    }

                    // TODO: handle libs with out a downloads prop, so far seems mostly to be fabric and old version of minecraft which only give url and name

                    Ok(())
                }
            })
        ).buffer_unordered(50).collect::<Vec<Result<(),LauncherLibError>>>();

        libs.await;

        // downlload Asset Indexs
        if let Some(assets) = manifest.asset_index {
            let root = self.game_dir.join("assets");

            let index_file = root.join(format!("indexes/{}.json", manifest.assets.expect("Should have assets")));
            Installer::download_file(&assets.url, &index_file, &assets.sha1).await?;

            let index_raw = fs::read_to_string(&index_file).await?;
            let asset_index = serde_json::from_str::<AssetIndex>(&index_raw)?;

            let asset_indexs = futures::stream::iter(
                asset_index.objects.iter().map(| (key, asset) |{
                    let item = root.clone();
                    async move {
                        let hash_id = format!("{}/{}",asset.hash.get(0..2).expect("Should be able to get"),asset.hash);
                        let out = item.join(&hash_id);
                        debug!("Index {}",key);
                        Installer::download_file(&format!("https://resources.download.minecraft.net/{}",hash_id), &out, &asset.hash).await?;

                        Ok(())
                    }
                })    
            ).buffer_unordered(50).collect::<Vec<Result<(),LauncherLibError>>>();

            asset_indexs.await;
        }

        // logging

        let logging_id = manifest.logging.client.file.id.ok_or_else(||LauncherLibError::Generic("Failed to get logging config name.".to_string()))?;
        let logging_config = self.game_dir.join(format!("assets/log_configs/{}",logging_id));
        Installer::download_file(&manifest.logging.client.file.url, &logging_config, &manifest.logging.client.file.sha1).await?;
        
        // java
        if let Some(java) = manifest.java_version {
            Installer::install_jvm(java.component,&self.game_dir).await?;
        }

       // debug!("{:#?}",manifest.arguments);

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder().filter_level(log::LevelFilter::max()).is_test(true).try_init();
    }

    #[tokio::test]
    async fn test_jvm_install() {
        init();

        let dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft");

        if let Err(err) = Installer::install_jvm("java-runtime-gamma".to_string(),&dir).await {
            eprintln!("{}",err);
        }

    }
    
    #[tokio::test]
    async fn test_sha1(){
        init();

        let dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft\\test.json");
        let url = "https://piston-meta.mojang.com/v1/packages/368cca4902de6067b3eb5131bdb575612f6b96e3/2.json".to_string();
        let sha1 = "368cca4902de6067b3eb5131bdb575612f6b96e3".to_string();

        if let Err(err) = Installer::download_file(&url, &dir, &sha1).await {
            eprintln!("{}",err);
        }

    }

    #[tokio::test]
    async fn test_installer(){
        init();

        let installer = Installer::new("1.19.3".to_string(), PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft"));

        if let Err(err) = installer.install().await {
            eprintln!("{:#?}",err);
        }
    }
}
