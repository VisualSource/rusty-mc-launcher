use std::path::PathBuf;
use std::env::consts;

use tokio::fs::{create_dir_all, File};
use normalize_path::NormalizePath;
use tokio::io::AsyncWriteExt;
use sha1::{Sha1,Digest};

use crate::errors::LauncherLibError;

pub mod jvm {
    use super::*;

    pub fn get_exec(runtime: &String, game_dir: &PathBuf, console: bool) -> PathBuf {
        let platform = get_platform();

        let cmd = if !console && consts::OS == "windows" {
            "javaw"
        } else {
            "java" 
        };

        let mut data = game_dir.join(format!("runtime/{0}/{1}/{0}/bin/{2}",runtime,platform,cmd));

        if consts::OS == "windows" {
            data.set_extension("exe");
        }

        if !data.is_file() {
            data = game_dir.join(format!("runtime/{0}/{1}/{0}/jre.bundle/Contents/Home/bin/{2}",runtime,platform,cmd));
        }

        data.normalize()
    }

    pub fn get_platform() -> String {
        match consts::OS {
            "windows" => {
                if consts::ARCH == "x86" {
                    "windows-x86".into()
                } else {
                    "windows-x64".into()
                }
            }
            "linux" => {
                if os_info::get().bitness() == os_info::Bitness::X32 {
                    "linux-i386".into()
                } else {
                    "linux".into()
                }
            }
            "macos" => {
                if consts::ARCH == "arm" {
                    "mac-os-arm64".into()
                } else {
                    "mac-os".into()
                }
            }
            _ => "gamecore".into()
        }
    }
}

pub async fn download_file(url: &String, dir: &PathBuf, sha1: &String) -> Result<String,LauncherLibError> {

    if let Some(p) = dir.parent() {
        if !p.exists() {
            create_dir_all(&p).await?;
        }
    }  

    //https://github.com/seanmonstar/reqwest/issues/1266
    let mut response = reqwest::get(url).await?;
    let mut file = File::create(&dir).await?;
    let mut hasher = Sha1::new();

    while let Some(mut chuck) = response.chunk().await? {
        hasher.update(&chuck);
        file.write_all_buf(&mut chuck).await?;
    }

    file.shutdown().await?;

    //https://github.com/RustCrypto/hashes/issues/185
    let result = hex::encode(hasher.finalize());

    if &result != sha1 {
        return Err(LauncherLibError::Sha1Error);
    }

    Ok(result)
}