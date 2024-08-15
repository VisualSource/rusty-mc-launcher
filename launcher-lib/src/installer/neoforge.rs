use crate::{error::LauncherError, installer::download::download_libraries, manifest::Manifest};
use log::debug;
use std::{path::Path, process::Stdio};
use tokio::{fs, io::AsyncBufReadExt, sync::mpsc::Sender};

use super::utils::{self, ChannelMessage};
use crate::event;

pub async fn get_latest_neoforge_version(minecraft_version: &str) -> Result<String, LauncherError> {
    let (_, major, _, minor) =
        lazy_regex::regex_captures!(r"\d\.(?<major>\d+)(\.(?<minor>\d+))?", minecraft_version)
            .ok_or_else(|| LauncherError::NotFound("Failed to find captures".to_string()))?;

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
                    .map_err(|e| LauncherError::Generic(e.to_string()))
            } else {
                Err(LauncherError::NotFound(
                    "value capture not found".to_string(),
                ))
            }?;
            let v = if let Some(value) = cap.name("loader_version") {
                Ok(value.as_str().to_string())
            } else {
                Err(LauncherError::NotFound(
                    "Capture loader_version not found".to_string(),
                ))
            }?;

            Ok::<(u64, String), LauncherError>((rev, v))
        })
        .max_by_key(|x| x.0);

    if let Some(value) = caps {
        Ok(value.1)
    } else {
        Err(LauncherError::NotFound(
            "No valid loader version could be found".to_string(),
        ))
    }
}

pub async fn get_installer_download_url(
    minecraft: &str,
    loader_version: Option<String>,
) -> Result<(String, String), LauncherError> {
    let loader_version = if let Some(v) = loader_version {
        v
    } else {
        get_latest_neoforge_version(minecraft).await?
    };

    let url = format!("https://maven.neoforged.net/releases/net/neoforged/neoforge/{0}/neoforge-{0}-installer.jar",loader_version);

    Ok((loader_version, url))
}

pub async fn run_installer(
    event_channel: &Sender<ChannelMessage>,
    version: &str,
    loader_version: Option<String>,
    runtime_directory: &Path,
    java: &str,
) -> Result<String, LauncherError> {
    event!(&event_channel,"update",{ "message":"Fetching installer manifest" });
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

    let file = tokio::fs::File::create_new(&log_file).await?;

    utils::download_file(&download_url, &installer_path, None, None).await?;
    event!(&event_channel,"update",{ "progress": 1, "message": "Running installer" });
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
        return Err(LauncherError::Generic("Installer errored".to_string()));
    }

    let mut stdout = tokio::io::BufReader::new(file);

    'logger: loop {
        let bytes = match stdout.fill_buf().await {
            Ok(line) => {
                let log = String::from_utf8_lossy(line);
                if !log.is_empty() {
                    log::info!("{}", log);
                    event!(&event_channel,"update",{ "message": log });
                }

                // You can delete this installer file now if you wish

                if log.contains("You can delete this installer file now if you wish") {
                    break 'logger;
                }

                line.len()
            }
            Err(err) => {
                log::error!("{}", err);
                return Err(LauncherError::IoError(std::io::Error::other(
                    "Unknown io error",
                )));
            }
        };

        stdout.consume(bytes);
    }

    event!(&event_channel,"update",{ "message": "Cleanup" });
    fs::remove_file(log_file).await?;
    fs::remove_file(&installer_path).await?;
    fs::remove_file(&launcher_profiles).await?;

    event!(&event_channel,"update",{ "progress": 1, "message": "Copying jar" });

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

    event!(&event_channel,"update",{ "progress": 1, "message": "Install Libraries" });

    let manifest = Manifest::read_manifest(&modded_manifest, false).await?;

    download_libraries(
        event_channel,
        runtime_directory,
        &modded_version,
        manifest.libraries,
    )
    .await?;

    event!(&event_channel,"update",{ "progress": 1 });

    Ok(loader_version)
}
