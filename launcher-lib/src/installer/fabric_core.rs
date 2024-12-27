use super::utils::{self};
use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::download::download_libraries,
    manifest::Manifest,
};
use normalize_path::NormalizePath;
use serde::Deserialize;
use std::{path::Path, process::Stdio};
use tokio::{fs, io::AsyncBufReadExt};
#[derive(Debug, Deserialize)]
struct LoaderVersion {
    version: String,
}

/// get either fabric or quilt's latest loader version
pub async fn get_latest_loader_version(url: &str) -> Result<String> {
    let response = utils::REQUEST_CLIENT.get(url).send().await?;

    let data = response.json::<Vec<LoaderVersion>>().await?;

    let latest = data.first().ok_or(Error::NotFound(
        "Failed to get latest loader version".to_string(),
    ))?;

    Ok(latest.version.to_owned())
}

/// get latest installer
pub async fn get_latest_installer(url: &str) -> Result<String> {
    let response = utils::REQUEST_CLIENT.get(url).send().await?;
    let xml = response.text().await?;
    let (_, version) = lazy_regex::regex_captures!("<latest>(?<version>.+)</latest>", &xml).ok_or(
        Error::NotFound("Failed to get fabric latest version".to_string()),
    )?;

    Ok(version.to_owned())
}

async fn run_installer(java: &str, installer_path: &Path, args: &Vec<&str>) -> Result<()> {
    let mut child = tokio::process::Command::new(java)
        .current_dir(installer_path)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .args(args)
        .spawn()?;

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

    Ok(())
}

pub async fn run_fabric_like_installer(
    installer_url: &str,
    cli_args: Vec<&str>,
    modded_version: &str,
    vanilla_jar: &Path,
    runtime_directory: &Path,
    java: &str,
    on_event: &tauri::ipc::Channel<DownloadEvent>,
) -> Result<()> {
    let temp_name = uuid::Uuid::new_v4();
    let installer_path = std::env::temp_dir();
    let installer_file = installer_path
        .join(format!("fabric-like-installer-{}.jar", temp_name))
        .normalize();

    utils::download_file(installer_url, &installer_file, None, None).await?;

    if !installer_path.exists() {
        return Err(Error::NotFound("Failed to find installer".to_string()));
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let mut args = vec![
        "-jar",
        installer_file
            .to_str()
            .ok_or_else(|| Error::Generic("Failed to get str".to_string()))?,
    ];
    args.extend(cli_args);

    log::debug!("Running installer with args {:?}", args);

    for idx in 0..1 {
        let result = run_installer(java, &installer_path, &args).await;

        if result.is_ok() {
            break;
        }

        log::warn!("Having to running installer again!");

        if result.is_err() && idx == 1 {
            return result;
        }
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    fs::remove_file(&installer_file).await?;

    let modded_directory = runtime_directory.join("versions").join(modded_version);
    let modded_manifest = modded_directory.join(format!("{}.json", &modded_version));
    let modded_jar = modded_directory.join(format!("{}.jar", modded_version));

    if modded_jar.exists() && modded_jar.is_file() {
        fs::remove_file(&modded_jar).await?;
    }

    log::debug!(
        "Copying {} to {}",
        vanilla_jar.to_string_lossy(),
        modded_jar.to_string_lossy()
    );
    let bytes = fs::copy(&vanilla_jar, &modded_jar).await?;
    log::debug!("Copyed {} bytes", bytes);

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
        modded_version,
        manifest.libraries,
    )
    .await?;

    Ok(())
}
