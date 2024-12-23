mod compression;
pub mod content;
mod download;
mod fabric;
mod forge;
mod metadata;
mod neoforge;
pub mod utils;
use std::time::Duration;

use crate::error::{Error, Result};
use crate::manifest::Manifest;
use crate::models::profile::Loader;
use crate::models::setting::Setting;
use download::{download_assets, download_client, download_java, download_libraries};

use metadata::get_launcher_manifest;
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};

//use crate::event;
//pub use utils::ChannelMessage;
#[derive(Debug, Deserialize, Serialize)]
pub struct InstallConfig {
    version: String,
    loader: Loader,
    loader_version: Option<String>,
}

impl InstallConfig {
    pub fn new(version: String, loader: Loader, loader_version: Option<String>) -> Self {
        Self {
            version,
            loader,
            loader_version,
        }
    }
}

/// Download the minecraft client, jre, and a mod loader if needed.
/// If a modloader was installed the loader version installed is returned.
///
/// Emits:
/// - 1  Started  event
/// - 20 Progress event
///     - 10 minecraft client/jre
///     - 10 modloader install
/// - 1  Finished event
pub async fn install_minecraft(
    config: InstallConfig,
    db: &crate::database::Database,
    on_event: &tauri::ipc::Channel<crate::events::DownloadEvent>,
) -> Result<Option<String>> {
    on_event
        .send(crate::events::DownloadEvent::Started {
            max_progress: 20,
            message: "Installing Minecraft.".into(),
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let root = Setting::path("path.app", db)
        .await?
        .ok_or_else(|| Error::NotFound("No runtime directory is avaiable.".into()))?;
    let runtime_directory = root.join("runtime");
    let version_directory = runtime_directory.join("versions").join(&config.version);

    let client_manfiest_file = version_directory
        .join(format!("{}.json", config.version))
        .normalize();

    if !(client_manfiest_file.exists() && client_manfiest_file.is_file()) {
        let launcher_manifest = get_launcher_manifest(Some(&config.version)).await?;
        utils::download_file(
            &launcher_manifest.url,
            &client_manfiest_file,
            None,
            Some(&launcher_manifest.sha1),
        )
        .await?;
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let manifset = Manifest::read_manifest(&client_manfiest_file, false).await?;
    let java_version = manifset
        .java_version
        .ok_or(Error::NotFound("Java not found".to_string()))?
        .major_version;

    let java_key = format!("java.{}", java_version);
    let java_exe = if let Some(setting) = Setting::get(&java_key, db).await? {
        setting.value
    } else {
        on_event
            .send(crate::events::DownloadEvent::Progress {
                amount: None,
                message: Some("Installing Java".into()),
            })
            .map_err(|err| Error::Generic(err.to_string()))?;
        let (build_version, path) = download_java(&runtime_directory, java_version).await?;

        let java_exe = path.to_string_lossy().to_string();

        Setting::insert(&java_key, java_exe.clone(), Some(build_version), db).await?;
        java_exe
    };

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    tokio::try_join! {
        download_client(on_event, &config.version, &version_directory, manifset.downloads),
        download_assets(on_event, &runtime_directory, manifset.asset_index),
        download_libraries(on_event,&runtime_directory,&config.version,manifset.libraries)
    }?;

    if config.loader != Loader::Vanilla {
        on_event
            .send(crate::events::DownloadEvent::Progress {
                amount: None,
                message: Some(format!("Installing {} mod loader", config.loader)),
            })
            .map_err(|err| Error::Generic(err.to_string()))?;

        let version_id = match config.loader {
            Loader::Vanilla => return Err(Error::Generic("Should not be here".to_string())),
            Loader::Neoforge => {
                neoforge::run_installer(
                    on_event,
                    &config.version,
                    config.loader_version,
                    &runtime_directory,
                    &java_exe,
                )
                .await?
            }
            Loader::Forge => {
                forge::run_installer(
                    on_event,
                    &config.version,
                    config.loader_version,
                    &runtime_directory,
                    &java_exe,
                )
                .await?
            }
            Loader::Fabric => {
                fabric::run_installer(
                    on_event,
                    &runtime_directory,
                    &java_exe,
                    &config.version,
                    config.loader_version,
                    false,
                )
                .await?
            }
            Loader::Quilt => {
                fabric::run_installer(
                    on_event,
                    &runtime_directory,
                    &java_exe,
                    &config.version,
                    config.loader_version,
                    true,
                )
                .await?
            }
        };

        Ok(Some(version_id))
    } else {
        on_event
            .send(crate::events::DownloadEvent::Progress {
                amount: Some(10),
                message: None,
            })
            .map_err(|err| Error::Generic(err.to_string()))?;

        Ok(None)
    }
}
