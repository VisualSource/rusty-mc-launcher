
use crate::json::{
    runtime::{
        MinecraftJavaRuntime,
        JVMFiles,
        RuntimeData,
        JvmManifest
    },
    install::Event
};
use crate::expections::{ LibResult, LauncherLibError};
use crate::utils::{ get_http_client, download_file };
use futures::StreamExt;
use tokio::fs::{ write, create_dir_all };
use std::env::{ consts };
use std::path::PathBuf;

const JVM_MANIFEST_URL: &str = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

/// Get the name that is used to identify the platform
fn get_jvm_platform_string() -> LibResult<String> {
    match consts::OS {
        "windows" => {
            if consts::ARCH == "x86" {
                return Ok("windows-x86".into());
            }

            Ok("windows-x64".into())
        }
        "macos" => Ok("mac-os".into()),
        "linux" => {
            if consts::ARCH == "x86" {
                return Ok("linux-i386".into());
            }
            Ok("linux".into())
        }
        _ => Err(LauncherLibError::Unsupported(format!("Platform ({}) is unspported",consts::OS)))
    }
}

/// returns a list of all mc jvm runtimes
async fn get_jvm_runtimes() -> LibResult<JvmManifest> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(JVM_MANIFEST_URL).send().await {
        Ok(res) => {
            match res.json::<JvmManifest>().await {
                Err(error) => Err(LauncherLibError::PraseJsonReqwest(error)),
                Ok(value) => Ok(value)
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            msg: "Failed to make http request".into(),
            source: err
        })
        
      
    }
}

fn get_manifest(arch: String, runtime: MinecraftJavaRuntime, runtimes: JvmManifest) -> LibResult<RuntimeData> {
    match runtimes.get_key_value(&arch) {
        Some((_,value)) => {
            match value.get_key_value(&runtime.to_string()) {
                Some((_,manifest)) => {
                    match manifest.last() {
                        Some(runtimedata) => Ok(runtimedata.to_owned()),
                        None => Err(LauncherLibError::General(format!("Failed to get runtime manifest for {} {}",arch,runtime.to_string())))
                    }
                }
                None => Err(LauncherLibError::NotFound(format!("Failed to get runtime manifest for {} {}",arch,runtime.to_string())))
            }
        }
        None => Err(LauncherLibError::NotFound(format!("Failed to get runtime manifest for {} {}",arch,runtime.to_string())))
    }
}

pub async fn install_jvm_runtime(jvm_version: MinecraftJavaRuntime, minecraft_dir: PathBuf, callback: &impl Fn(Event)) -> LibResult<()> {
    let runtimes = match get_jvm_runtimes().await {
        Err(err) => return Err(err),
        Ok(value) => value
    };
    let arch = match get_jvm_platform_string() {
        Err(err) => return Err(err),
        Ok(value) => value
    };

    let manifest: RuntimeData = match get_manifest(arch.clone(), jvm_version.clone(), runtimes) {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let src_download = match client.get(manifest.manifest.url.as_str()).send().await {
        Ok(value) => {
            match value.json::<JVMFiles>().await {
                Ok(json) => json,
                Err(err) => return Err(LauncherLibError::PraseJsonReqwest(err))
            }
        },
        Err(error) => return Err(LauncherLibError::HTTP {
            source: error,
            msg: "Failed to make http call".into()
        })
        
    };

    let root = minecraft_dir.join("runtime").join(jvm_version.to_string()).join(arch.clone()).join(jvm_version.to_string());

    let file_count = src_download.files.len();

    let files = futures::stream::iter( 
        src_download.files.into_iter().enumerate().map(|(idx,(key,value))|{
            let cur = root.join(key.clone());
            async move {
                match value.action.as_str() {
                    "file" => {
                        if let Some(download) = &value.downloads {
                            if let Some(lzma) = download.lzma.clone() {
                                if let Err(error) = download_file(lzma.url, cur.clone(), callback, Some(lzma.sha1), true).await {
                                     return Err(error);
                                }
                            } else {
                                if let Err(error) = download_file(download.raw.url.clone(), cur.clone(), callback, Some(download.raw.sha1.clone()), false).await {
                                    return Err(error);
                                }
                            }
                            callback(Event::progress(idx,file_count));
                        }
                    }
                    "directory" => {
                        if !cur.exists() {
                            if let Err(error) = create_dir_all(cur).await {
                                return Err(LauncherLibError::OS {
                                    source: error,
                                    msg: "Failed to create directory".into()
                                });
                            }
                        }
                        callback(Event::progress(idx,file_count));
                    }
                    _ => {}
                }

                
                Ok(())
            }
        })

     ).buffer_unordered(8).collect::<Vec<Result<(),LauncherLibError>>>();

     files.await;

    let version = minecraft_dir.join("runtime").join(jvm_version.to_string()).join(arch).join(".version");

    if let Err(error) = write(version,manifest.version.name).await {
        return Err(LauncherLibError::OS {
            source: error,
            msg: "Failed to write file".into()
        });
    }

    Ok(())
}

/// Returns the path to the java executable. None if it does not exists
pub fn get_exectable_path(jvm_version: MinecraftJavaRuntime, minecraft_dir: PathBuf) -> LibResult<Option<PathBuf>> {
    let version = jvm_version.to_string();
    match get_jvm_platform_string() {
        Ok(platform) => {
            let mut java_path = minecraft_dir.join("runtime").join(version.clone()).join(platform).join(version).join("bin").join("javaw");

            if java_path.is_file() {
                return Ok(Some(java_path));
            }

            let exe_java = java_path.with_extension("exe");

            if exe_java.is_file() {
                return Ok(Some(exe_java));
            }

            java_path.pop();
            java_path.pop();

            let jre = java_path.join("jre.bundle").join("Contents").join("Home").join("bin").join("javaw");

            if jre.is_file() {
                return Ok(Some(jre));
            }

            Ok(None)
        }
        Err(err)=>{
            Err(err)
        }
    }
}

pub fn does_runtime_exist(jvm_version: MinecraftJavaRuntime, minecraft_dir: PathBuf) -> LibResult<bool> { 
    let version = jvm_version.to_string();
    let platform = match get_jvm_platform_string() {
        Ok(value) => value,
        Err(err) => return Err(err)
    };
    let java_path = minecraft_dir.join("runtime").join(version.clone()).join(platform).join(version).join("bin").join("javaw");

    if java_path.is_file() {
        return Ok(true);
    }

    let exe_java = java_path.with_extension("exe");

    if exe_java.is_file() {
        return Ok(true);
    }

    Ok(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    fn test_callback(event: Event) {
        println!("{:#?}",event);
    }
    #[tokio::test]
    async fn test_install_jvm_runtime() {
        if let Err(err) = install_jvm_runtime(MinecraftJavaRuntime::JavaRuntimeBeta, PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft"), &test_callback).await {
            eprintln!("{}",err);
        }
        
    }
    #[test]
    fn test_get_jvm_platform_string() {
        match get_jvm_platform_string() {
            Ok(value) => println!("{}",value),
            Err(err) => eprintln!("{}",err)
        }
    }
    #[tokio::test]
    async fn test_get_jvm_runtimes() {
        match get_jvm_runtimes().await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }
    #[test]
    fn test_get_exectable_path() {
        match get_exectable_path(MinecraftJavaRuntime::JavaRuntimeAlpha,PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft")) {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

    #[test]
    fn test_does_runtime_exist() {
        match does_runtime_exist(MinecraftJavaRuntime::JavaRuntimeAlpha,PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft")) {
            Ok(value) => assert_eq!(value,true),
            Err(err) => eprintln!("{}",err)
        }
    }

    #[tokio::test]
    async fn test_get_manifest() {
        if let Ok(value) = get_jvm_runtimes().await {
            match get_manifest("windows-x64".into(), MinecraftJavaRuntime::JavaRuntimeAlpha, value) {
                Ok(value) => println!("{:#?}",value),
                Err(err) => eprintln!("{}",err)
            }
        }
    }
}