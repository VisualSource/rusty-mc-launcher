use std::env::consts;
use std::path::PathBuf;

use normalize_path::NormalizePath;
use sha1::{Digest, Sha1};
use tokio::fs::{create_dir_all, remove_file, File};
use tokio::io::AsyncWriteExt;

use crate::errors::LauncherLibError;

pub mod fabric {
    use super::*;
    use serde::Deserialize;
    use std::env::temp_dir;
    use std::process::Stdio;
    use tokio::process::Command;

    const FABRIC_VERSIONS: &str = "https://meta.fabricmc.net/v2/versions/";
    #[derive(Deserialize)]
    struct InstallerDownload {
        pub url: String,
        maven: String,
        version: String,
        pub stable: bool,
    }
    #[derive(Deserialize)]
    struct FabricMeta {
        installer: Vec<InstallerDownload>,
    }

    pub async fn run_fabric_installer(
        mc: &String,
        loader_version: &String,
        game_dir: &PathBuf,
        runtime: String,
    ) -> Result<(), LauncherLibError> {
        let temp = temp_dir().join("fabricInstaller.jar").normalize();
        let content = reqwest::get(FABRIC_VERSIONS)
            .await?
            .json::<FabricMeta>()
            .await?;

        let download =
            content
                .installer
                .into_iter()
                .find(|x| x.stable)
                .ok_or(LauncherLibError::NotFound(
                    "Failed to find statle fabric installer".to_string(),
                ))?;

        download_file(&download.url, &temp, None).await?;

        let exec = jvm::get_exec(&runtime, game_dir, true);

        let args = [
            "-jar",
            temp.to_str().ok_or(LauncherLibError::PathBufError)?,
            "client",
            "-dir",
            game_dir.to_str().ok_or(LauncherLibError::PathBufError)?,
            "-mcversion",
            mc.as_str(),
            "-loader",
            loader_version.as_str(),
            "-noprofile",
            "-snapshot",
        ];

        Command::new(exec)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .args(args)
            .output()
            .await?;

        remove_file(&temp).await?;

        Ok(())
    }
}
pub mod jvm {
    use super::*;

    pub fn get_exec(runtime: &String, game_dir: &PathBuf, console: bool) -> PathBuf {
        let platform = get_platform();

        let cmd = if !console && consts::OS == "windows" {
            "javaw"
        } else {
            "java"
        };

        let mut data = game_dir.join(format!(
            "runtime/{0}/{1}/{0}/bin/{2}",
            runtime, platform, cmd
        ));

        if consts::OS == "windows" {
            data.set_extension("exe");
        }

        if !data.is_file() {
            data = game_dir.join(format!(
                "runtime/{0}/{1}/{0}/jre.bundle/Contents/Home/bin/{2}",
                runtime, platform, cmd
            ));
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
            _ => "gamecore".into(),
        }
    }
}

pub async fn download_file(
    url: &String,
    dir: &PathBuf,
    sha1: Option<&String>,
) -> Result<String, LauncherLibError> {
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

    if let Some(sha) = sha1 {
        if &result != sha {
            return Err(LauncherLibError::Sha1Error);
        }
    }

    Ok(result)
}
