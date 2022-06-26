use crate::expections::{ LauncherLibError,LibResult};
use crate::utils::{get_http_client, download_file };
use crate::vanilla::get_vanilla_versions;
use crate::mod_utiles::get_metadata;
use crate::runtime::get_exectable_path;
use crate::install::install_minecraft_version;
use crate::runtime::{ install_jvm_runtime, does_runtime_exist };
use crate::json::{
    runtime::MinecraftJavaRuntime,
    install::{ Event }
};
use std::path::PathBuf;
use serde::{ Deserialize, Serialize };
use tokio::process::{Command};
use std::process::Stdio;

const FABRIC_API_ROOT: &str = "https://meta.fabricmc.net/v2/versions/";
const FABRIC_INSTALLER_MAVEN: &str = "https://maven.fabricmc.net/net/fabricmc/fabric-installer/";

#[derive(Serialize,Deserialize, Debug,Clone)]
pub struct FabricVersionItem {
    pub version: String,
    pub stable: bool
}

#[derive(Deserialize, Debug,Clone)]
pub struct FabricLoaderVersion {
    pub version: String,
}
///
/// Returns a list of minecraft versions that fabric currently supports
pub async fn get_supported_mc_versions() -> LibResult<Vec<FabricVersionItem>> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(format!("{}game",FABRIC_API_ROOT).as_str()).send().await {
        Ok(value) => {
            match value.json::<Vec<FabricVersionItem>>().await {
                Ok(versions) => Ok(versions),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(error) => Err(LauncherLibError::HTTP{ 
            source: error,
            msg: "Failed to make request".into()
        })
    }
}
///
/// Returns a list of stable (major versions, no snapshots,RC, etc ) minecraft versions that fabric currently supports
pub async fn get_supported_stable_versions() -> LibResult<Vec<FabricVersionItem>> {
    let versions = match get_supported_mc_versions().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let mut stable: Vec<FabricVersionItem> = vec![];
    for version in versions.iter().filter(|version|version.stable == true) {
        stable.push(version.clone());
    }

    Ok(stable)
}

/// get the latest version that fabric supported 
pub async fn get_latest_supported() -> LibResult<String> {
    let mc = match get_supported_mc_versions().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };
    match mc.get(0) {
        Some(version) => Ok(version.version.clone()),
        None => Err(LauncherLibError::NotFound("Unknown".into()))
    }
}

/// given a minecraft version string it checks if it is supported by fabric
pub async fn is_supported(mc_version: String) -> LibResult<bool> {
    let versions = match get_supported_mc_versions().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let is_vaild = versions.iter().any(|e| e.version == mc_version);

    Ok(is_vaild)
}

/// Gets the loaders versions of fabric
pub async fn get_loader_versions() -> LibResult<Vec<FabricLoaderVersion>> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(format!("{}loader",FABRIC_API_ROOT).as_str()).send().await {
        Ok(value) => {
            match value.json::<Vec<FabricLoaderVersion>>().await {
                Ok(versions) => Ok(versions),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to make http request".into()
        })
    }
}

pub async fn get_latest_loader_version() -> LibResult<String> {
    let loaders = match get_loader_versions().await {
      Ok(value) => value,
      Err(err) => return Err(err)  
    };
    match loaders.get(0) {
        Some(value) => Ok(value.version.clone()),
        None => Err(LauncherLibError::NotFound("Unkown".into()))
    }
}

async fn get_latest_installer() -> LibResult<String> {
    match get_metadata(FABRIC_INSTALLER_MAVEN).await {
        Ok(value) => Ok(value.versioning.release.clone()),
        Err(err) => return Err(err)
    }
}
/// handles that install of the fabric client along with minecraft
pub async fn install_fabric(mc: String, mc_dir: PathBuf, loader: Option<String>, callback: &impl Fn(Event), java: Option<PathBuf>, temp_path: PathBuf) -> LibResult<()> {

    let runtime = MinecraftJavaRuntime::use_latest();
    match does_runtime_exist(runtime.clone(), mc_dir.clone()) {
        Ok(value) => {
            if !value {
                if let Err(err) = install_jvm_runtime(runtime, mc_dir.clone(), callback).await {
                    return Err(err);
                }
            }
        }
        Err(err) => return Err(err)
    }

    let mc_path = mc_dir.join("versions").join(mc.clone()).join(format!("{}.json",mc));

    // check if given mc version is a offical version.
    match get_vanilla_versions().await {
        Ok(version) => {
            if !version.iter().any(|e| e.id == mc) {
                return Err(LauncherLibError::NotFound(mc))
            }
        }
        Err(err) => return Err(err)
    }

    // check if given minecraft version is supported by fabric
    match is_supported(mc.clone()).await {
        Err(err) => return Err(err),
        Ok(value) => {
            if !value {
                return Err(LauncherLibError::Unsupported(mc));
            }
        }
    }

    let loaderv = match loader {
        Some(value) => value,
        None => {
            match get_latest_loader_version().await {
                Ok(value) => value,
                Err(err) => return Err(err)
            }
        }
    };

    if !mc_path.is_file() {
        if let Err(err) = install_minecraft_version(mc.clone(), mc_dir.clone(), callback).await {
            return Err(err);
        }
    }

    let fabric_mc = format!("fabric-loader-{}-{}",loaderv,mc).to_string();

    let fabric = mc_dir.join("versions").join(fabric_mc.clone()).join(format!("{}.json",fabric_mc));

    if fabric.is_file() {
        return Ok(());
    }

    let installer_version = match get_latest_installer().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let installer_url = format!("{maven}{version}/fabric-installer-{version}.jar",
        maven=FABRIC_INSTALLER_MAVEN,
        version=installer_version
    ).to_string();

    let installer_file = temp_path.join("fabric-install.js");

    callback(Event::progress(0, 1));
    if let Err(err) = download_file(installer_url, installer_file.clone(), callback, None, false).await {
        return Err(err);
    }
    callback(Event::progress(1, 1));

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
        installer_file.to_str().expect("Failed to make path a string"),
        "client",
        "-dir",
        mc_dir.to_str().expect("Failed to make path a string"),
        "-mcversion",
        mc.as_str(),
        "-loader",
        loaderv.as_str(),
        "-noprofile"
    ];

    match Command::new(exec).args(args).stdout(Stdio::inherit()).output().await {
        Ok(value) => {
            callback(Event::Status(String::from_utf8_lossy(&value.stderr).to_string()));
            callback(Event::Status(String::from_utf8_lossy(&value.stdout).to_string()));
            callback(Event::Status(value.status.to_string()));

            if let Err(err) = std::fs::remove_file(installer_file) {
                return Err(LauncherLibError::OS {
                    source: err,
                    msg: "Failed to remove file".into()
                });
            }

        }
        Err(err) => return Err(LauncherLibError::OS {
            source: err,
            msg: "Failed to run command".into()
        })
    };

    install_minecraft_version(fabric_mc, mc_dir, callback).await
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_loader_versions() {
        match get_loader_versions().await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

    #[tokio::test]
    async fn test_get_supported_mc_versions() {
        match get_supported_mc_versions().await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }
}