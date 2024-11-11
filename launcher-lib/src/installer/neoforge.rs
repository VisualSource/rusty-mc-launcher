use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::download::download_libraries,
    manifest::Manifest,
};
use log::debug;
use std::{path::Path, process::Stdio};
use tokio::{fs, io::AsyncBufReadExt};

use super::utils::{self};

pub async fn get_latest_neoforge_version(minecraft_version: &str) -> Result<String> {
    let (_, major, _, minor) =
        lazy_regex::regex_captures!(r"\d\.(?<major>\d+)(\.(?<minor>\d+))?", minecraft_version)
            .ok_or_else(|| Error::NotFound("Failed to find captures".to_string()))?;

    let minor = if minor.is_empty() { "0" } else { minor };

    let response = utils::REQUEST_CLIENT
        .get("https://maven.neoforged.net/releases/net/neoforged/neoforge/maven-metadata.xml")
        .send()
        .await?;

    let data = response.text().await?;

    let regex = regex::Regex::new(&format!(
        r"<version>(?<loader_version>{}\.{}\.(?<value>\d+)(-beta)?)</version>",
        major, minor
    ))?;
    let caps = regex
        .captures_iter(&data)
        .flat_map(|cap| {
            let rev = if let Some(value) = cap.name("value") {
                value
                    .as_str()
                    .parse::<u64>()
                    .map_err(|e| Error::Generic(e.to_string()))
            } else {
                Err(Error::NotFound("value capture not found".to_string()))
            }?;
            let v = if let Some(value) = cap.name("loader_version") {
                Ok(value.as_str().to_string())
            } else {
                Err(Error::NotFound(
                    "Capture loader_version not found".to_string(),
                ))
            }?;

            Ok::<(u64, String), Error>((rev, v))
        })
        .max_by_key(|x| x.0);

    if let Some(value) = caps {
        Ok(value.1)
    } else {
        Err(Error::NotFound(
            "No valid loader version could be found".to_string(),
        ))
    }
}

pub async fn get_installer_download_url(
    minecraft: &str,
    loader_version: Option<String>,
) -> Result<(String, String)> {
    let loader_version = if let Some(v) = loader_version {
        v
    } else {
        get_latest_neoforge_version(minecraft).await?
    };

    let url = format!("https://maven.neoforged.net/releases/net/neoforged/neoforge/{0}/neoforge-{0}-installer.jar",loader_version);

    Ok((loader_version, url))
}

pub async fn run_installer(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    version: &str,
    loader_version: Option<String>,
    runtime_directory: &Path,
    java: &str,
) -> Result<String> {
    let (loader_version, download_url) =
        get_installer_download_url(version, loader_version).await?;

    let temp = std::env::temp_dir();
    let installer_path = temp.join(format!("installer-{}.jar", loader_version));
    let log_file = temp.join(format!("installer-{}.jar.log", loader_version));
    if installer_path.exists() && installer_path.is_file() {
        fs::remove_file(&installer_path).await?;
    }
    if log_file.exists() {
        fs::remove_file(&log_file).await?;
    }

    let launcher_profiles = runtime_directory.join("launcher_profiles.json");
    if !launcher_profiles.exists() || !launcher_profiles.is_file() {
        fs::write(&launcher_profiles, b"{\"profiles\":{}}").await?;
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let file = tokio::fs::File::create_new(&log_file).await?;

    utils::download_file(&download_url, &installer_path, None, None).await?;

    let child = tokio::process::Command::new(java)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .current_dir(temp)
        .arg("-jar")
        .arg(installer_path.to_string_lossy().to_string())
        .arg("--installClient")
        .arg(runtime_directory.to_string_lossy().to_string())
        .output()
        .await?;

    if !child.status.success() {
        return Err(Error::Generic("Installer errored".to_string()));
    }

    let mut stdout = tokio::io::BufReader::new(file);

    'logger: loop {
        let bytes = match stdout.fill_buf().await {
            Ok(line) => {
                let log = String::from_utf8_lossy(line);
                if !log.is_empty() {
                    log::info!("{}", log);
                    //event!(&event_channel,"update",{ "message": log });
                }

                // You can delete this installer file now if you wish

                if log.contains("You can delete this installer file now if you wish") {
                    break 'logger;
                }

                line.len()
            }
            Err(err) => {
                log::error!("{}", err);
                return Err(Error::IoError(std::io::Error::other("Unknown io error")));
            }
        };

        stdout.consume(bytes);
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    fs::remove_file(log_file).await?;
    fs::remove_file(&installer_path).await?;
    fs::remove_file(&launcher_profiles).await?;

    let modded_version = format!("neoforge-{}", loader_version);

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

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let manifest = Manifest::read_manifest(&modded_manifest, false).await?;

    download_libraries(
        on_event,
        runtime_directory,
        &modded_version,
        manifest.libraries,
    )
    .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(loader_version)
}
