use crate::expections::{ LauncherLibError, LibResult };
use crate::utils::download_file;
use crate::mod_utiles::get_metadata;
use crate::runtime::get_exectable_path;
use crate::install::install_minecraft_version;
use crate::json::{
    runtime::MinecraftJavaRuntime,
    install::{ Event }
};
use tokio::process::Command;
use tokio::fs::remove_file;
use std::process::{ Stdio };
use std::path::PathBuf;
use log::{info};

const FORGE_DOWNLOAD_URL: &str = "https://files.minecraftforge.net/maven/net/minecraftforge/forge/{version}/forge-{version}-installer.jar";
const FORGE_HEADLESS_URL: &str = "https://github.com/TeamKun/ForgeCLI/releases/download/1.0.1/ForgeCLI-1.0.1-all.jar";
const FORGE_MAVEN_ROOT: &str = "https://maven.minecraftforge.net/net/minecraftforge/forge/";

pub async fn get_forge_versions() -> LibResult<Vec<String>> {
    match get_metadata(FORGE_MAVEN_ROOT).await {
        Ok(value) => {
            Ok(value.versioning.versions.version)
        },
        Err(err) => return Err(err)
    }
}

pub async fn is_supported(mc: String) -> LibResult<bool> {
    match get_forge_versions().await {
        Ok(versions) => {
            for version in versions {
                if let Some(forge) = version.split("-").collect::<Vec<&str>>().get(0) {
                    if *forge == &mc {
                        return Ok(true);
                    }
                }
            }
            return Ok(false);
        }
        Err(err) => Err(err)
    }
}

pub async fn vaild_forge_version(forge: String, mc: Option<String>) -> LibResult<bool> {
    match get_forge_versions().await {
        Ok(versions) => {
            for version in versions {
                let data = version.split("-").collect::<Vec<&str>>();
                if let Some(loader) = data.get(1) {
                    let vaild = *loader == &forge;

                    if let Some(mc_v) = &mc {
                        if let Some(minecraft) = data.get(0) {
                            if vaild && (mc_v == minecraft) {
                                return Ok(true);
                            } 
                        }
                    }

                    if vaild {
                        return Ok(true);
                    }
                }
            }

            Err(LauncherLibError::NotFound(forge))
        }
        Err(err) => Err(err)
    }
}

pub async fn install_forge(mc: String, mc_dir: PathBuf, temp_path: PathBuf,  callback: &impl Fn(Event), cache_path: Option<PathBuf>, loader: Option<String>, java: Option<PathBuf>, cache_headless: bool, cache_installer: bool) -> LibResult<()> {

    let loader_version = match loader {
        Some(value) => {
            match vaild_forge_version(value.clone(), Some(mc.clone())).await {
                Ok(r) => {
                    if !r {
                        return Err(LauncherLibError::Unsupported(mc));
                        
                    }
                    value
                }
                Err(err) => return Err(err)
            }
        }
        None => {
            match get_forge_versions().await {
                Ok(versions) => {
                    let mut data = String::default();
                    for version in versions {
                        let content = version.split("-").collect::<Vec<&str>>();
                        if let Some(forge) = content.get(0) {
                            if *forge == &mc {
                                if let Some(value) = content.get(1) {
                                    data = value.to_string();
                                    break;
                                }
                            }
                        }
                    }

                    if data.is_empty() {
                        return Err(LauncherLibError::NotFound(mc.clone()));
                    }

                    data
                }
                Err(err) => return Err(err) 
            }
        }
    };

    let headless_path = if cache_headless {
        match cache_path.clone() {
            Some(value) => value,
            None => temp_path.clone()
        }
    } else {
        temp_path.clone()
    };

    let forge_jar = if cache_installer {
        match cache_path {
            Some(value) => value,
            None => temp_path.clone()
        }
    } else {
        temp_path.clone()
    };

    callback(Event::Status("Checking for vanilla minecraft".into()));
    if !mc_dir.join("versions").join(mc.clone()).join(format!("{}.json",mc.clone())).is_file() {
        if let Err(err) = install_minecraft_version(mc.clone(), mc_dir.clone(), callback).await {
            return Err(err);
        }
    }

    let forge_id = format!("{}-forge-{}",mc.clone(),loader_version.clone()).to_string();

    let headless_file = headless_path.join("ForgeCLI.jar");
    let forge_jar_file = forge_jar.join(format!("{}.jar",forge_id.clone()));

    callback(Event::Status("Downloading ForgeCLI".into()));
    callback(Event::progress(0, 2));
    if let Err(err) = download_file(FORGE_HEADLESS_URL.into(), headless_file.clone(), callback, None, false).await {
        return Err(err);
    }
    callback(Event::progress(1, 2));

    
    let forge_url = FORGE_DOWNLOAD_URL.replace("{version}", format!("{}-{}",mc.clone(),loader_version.clone()).as_str()).to_string();
    callback(Event::Status("Downloading Forge".into()));
    if let Err(err) = download_file(forge_url, forge_jar_file.clone(), callback, None, false).await {
        return Err(err);
    }
    callback(Event::progress(2, 2));

    let exec: String = match java {
        Some(value) => value.to_str().expect("Failed to make string").into(),
        None => {
            match get_exectable_path(MinecraftJavaRuntime::use_latest(), mc_dir.clone()) {
                Ok(value) => {
                    match value {
                        Some(j) => j.to_str().expect("Failed to make string").into(),
                        None => "java".into()
                    }
                }
                Err(err) => return Err(err)
            }
        }
    };

    let args = [
        "-jar",
        headless_file.to_str().expect("Failed to make str"),
        "--installer",
        forge_jar_file.to_str().expect("Failed to make str"),
        "--target",
        mc_dir.to_str().expect("Failed to convert to str")
    ];

    match Command::new(exec).args(args).stdout(Stdio::inherit()).output().await {
        Ok(output) => {
            info!("Stderr: {}",String::from_utf8_lossy(&output.stderr));
            info!("Stdout: {}",String::from_utf8_lossy(&output.stdout));
            info!("Status: {}",output.status);
         
            callback(Event::Status("Starting cleanup".into()));
            callback(Event::progress(0, 2));

            if !cache_headless {
                if let Err(err) = remove_file(headless_file).await {
                    return Err(LauncherLibError::OS {
                        source: err,
                        msg: "Failed to remove ForgeCLI.jar".into()
                    });
                }
            }
            callback(Event::progress(1, 2));
            if !cache_installer {
                if let Err(err) = remove_file(forge_jar_file).await {
                    return Err(LauncherLibError::OS {
                        source: err,
                        msg: "Failed to remove forge installer jar".into()
                    });
                }
            }
            callback(Event::progress(2, 2));
        }
        Err(err) => return Err(LauncherLibError::OS {
            source: err,
            msg: "Failed to run command".into()
        }) 
    };

    install_minecraft_version(forge_id, mc_dir, callback).await
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[tokio::test]
    async fn test_get_forge_versions() {
        match get_forge_versions().await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

    #[tokio::test]
    async fn test_forge_is_supported() {
        match is_supported("1.18.1".into()).await {
            Ok(value) => {
                assert_eq!(value,true);
            }
            Err(err) => {
                eprintln!("{}",err);
                panic!();
            }
        }
        match is_supported("1.56.1".into()).await {
            Ok(value) => {
                assert_eq!(value,false);
            }
            Err(err) => {
                eprintln!("{}",err);
                panic!();
            }
        }
    }

    #[tokio::test]
    async fn test_vaild_forge_version() {
        match vaild_forge_version("39.0.75".into(),None).await {
            Ok(value) => {
                assert_eq!(value,true);
            }
            Err(err) => {
                eprintln!("{}",err);
                panic!();
            }
        }
        match vaild_forge_version("39.0.75".into(),Some("1.18.1".into())).await {
            Ok(value) => {
                assert_eq!(value,true);
            }
            Err(err) => {
                eprintln!("{}",err);
                panic!();
            }
        }
    }

}