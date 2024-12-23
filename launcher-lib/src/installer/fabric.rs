use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::download::download_libraries,
    manifest::Manifest,
};
use log::debug;
use normalize_path::NormalizePath;
use serde::Deserialize;
use std::{path::Path, process::Stdio};
use tokio::{fs, io::AsyncBufReadExt};

use super::utils::{self};

#[derive(Debug, Deserialize)]
struct LoaderVersion {
    version: String,
}

pub async fn get_latest_loader_version(quilt: bool) -> Result<String> {
    let source = match quilt {
        true => "https://meta.quiltmc.org/v3/versions/loader",
        false => "https://meta.fabricmc.net/v2/versions/loader",
    };

    let response = utils::REQUEST_CLIENT.get(source).send().await?;

    let data = response.json::<Vec<LoaderVersion>>().await?;

    let latest = data.first().ok_or(Error::NotFound(
        "Failed to get latest fabric loader version".to_string(),
    ))?;

    Ok(latest.version.to_owned())
}

pub async fn get_latest_installer(quilt: bool) -> Result<String> {
    let source = match  quilt {
        true => "https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/maven-metadata.xml",
        false => "https://maven.fabricmc.net/net/fabricmc/fabric-installer/maven-metadata.xml"
    };
    let response = utils::REQUEST_CLIENT.get(source).send().await?;
    let xml = response.text().await?;
    let (_, version) = lazy_regex::regex_captures!("<latest>(?<version>.+)</latest>", &xml).ok_or(
        Error::NotFound("Failed to get fabric latest version".to_string()),
    )?;

    Ok(version.to_owned())
}

pub async fn run_installer(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    runtime_directory: &Path,
    java: &str,
    version: &str,
    loader_version: Option<String>,
    quilt: bool,
) -> Result<String> {
    let loader_version = if let Some(version) = loader_version {
        version
    } else {
        get_latest_loader_version(quilt).await?
    };

    let installer_version = get_latest_installer(quilt).await?;
    let installer_url = match quilt {
        false => format!(
            "https://maven.fabricmc.net/net/fabricmc/fabric-installer/{0}/fabric-installer-{0}.jar",
            installer_version
        ),
        true =>  format!(
            "https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/{0}/quilt-installer-{0}.jar",
            installer_version
        )
    } ;

    let temp_name = uuid::Uuid::new_v4();
    let installer_path = std::env::temp_dir()
        .join(format!("installer-{}.jar", temp_name))
        .normalize();

    utils::download_file(&installer_url, &installer_path, None, None).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let mut child = match quilt {
        false => tokio::process::Command::new(java)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .arg("-jar")
            .arg(installer_path.to_string_lossy().to_string())
            .arg("client")
            .arg("-dir")
            .arg(runtime_directory.to_string_lossy().to_string())
            .arg("-mcversion")
            .arg(version)
            .arg("-loader")
            .arg(&loader_version)
            .arg("-noprofile")
            .arg("-snapshot")
            .spawn()?,
        true => tokio::process::Command::new(java)
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .arg("-jar")
            .arg(installer_path.to_string_lossy().to_string())
            .arg("install")
            .arg("client")
            .arg(version)
            .arg(&loader_version)
            .arg(format!(
                "--install-dir={}",
                runtime_directory.to_string_lossy()
            ))
            .arg("--no-profile")
            .spawn()?,
    };

    let stdout = child
        .stdout
        .as_mut()
        .ok_or(Error::IoError(std::io::Error::other(
            "Failed to get process stdout",
        )))?;
    let stderr = child
        .stderr
        .as_mut()
        .ok_or(Error::IoError(std::io::Error::other(
            "Failed to get process stdout",
        )))?;

    let mut stdout = tokio::io::BufReader::new(stdout);
    let mut stderr = tokio::io::BufReader::new(stderr);

    loop {
        let (stdout_bytes, stderr_bytes) = match (stdout.fill_buf().await, stderr.fill_buf().await)
        {
            (Ok(stdout), Ok(stderr)) => {
                let log = String::from_utf8_lossy(stdout);
                if !log.is_empty() {
                    log::info!("{}", log);
                }

                let err = String::from_utf8_lossy(stderr);
                if !err.is_empty() {
                    log::error!("{}", err);
                }

                (stdout.len(), stderr.len())
            }
            other => {
                if other.0.is_err() {
                    log::error!("{}", other.0.expect_err("Failed to get error"));
                }

                if other.1.is_err() {
                    log::error!("{}", other.1.expect_err("Failed to get error"));
                }

                return Err(Error::IoError(std::io::Error::other("Unknown io error")));
            }
        };

        if stdout_bytes == 0 && stderr_bytes == 0 {
            break;
        }

        stdout.consume(stdout_bytes);
        stderr.consume(stderr_bytes);
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    tokio::fs::remove_file(&installer_path).await?;

    let modded_version = match quilt {
        false => format!("fabric-loader-{}-{}", loader_version, version),
        true => format!("quilt-loader-{}-{}", loader_version, version),
    };

    let modded_directory = runtime_directory.join("versions").join(&modded_version);
    let modded_manifest = modded_directory.join(format!("{}.json", &modded_version));
    let modded_jar = modded_directory.join(format!("{}.jar", modded_version));
    let vanilla_jar = runtime_directory
        .join("versions")
        .join(version)
        .join(format!("{}.jar", version));

    if modded_jar.exists() && modded_jar.is_file() {
        fs::remove_file(&modded_jar).await?;
    }

    debug!(
        "Copying {} to {}",
        vanilla_jar.to_string_lossy(),
        modded_jar.to_string_lossy()
    );
    let bytes = fs::copy(&vanilla_jar, &modded_jar).await?;
    debug!("Copyed {} bytes", bytes);

    let manifest = Manifest::read_manifest(&modded_manifest, false).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(4),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    download_libraries(
        on_event,
        runtime_directory,
        &modded_version,
        manifest.libraries,
    )
    .await?;

    Ok(loader_version)
}

#[cfg(test)]
mod tests {
    /*use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }*/

    /*#[tokio::test]
    async fn test_fabric_install() {
        init();
        let temp = std::env::temp_dir();
        let runtime_dir = temp.join("runtime");
        let java = runtime_dir.join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe");

        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);

        run_installer(
            &tx,
            &runtime_dir,
            java.to_string_lossy().as_ref(),
            "1.20.6",
            None,
            false,
        )
        .await
        .expect("Failed to install");
    }

    #[tokio::test]
    async fn test_quilt_install() {
        init();
        let temp = std::env::temp_dir();
        let runtime_dir = temp.join("runtime");
        let java = runtime_dir.join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe");

        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);

        run_installer(
            &tx,
            &runtime_dir,
            java.to_string_lossy().as_ref(),
            "1.20.6",
            None,
            true,
        )
        .await
        .expect("Failed to install");
    }*/
}
