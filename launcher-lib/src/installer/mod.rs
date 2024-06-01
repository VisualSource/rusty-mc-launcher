mod compression;
pub mod content;
mod download;
mod fabric;
mod forge;
mod metadata;
pub mod utils;
use crate::state::profile::Loader;

use download::{download_assets, download_client, download_java, download_libraries};
use tokio::sync::mpsc;

use crate::manifest::Manifest;
use crate::{errors::LauncherError, state::AppState};

use metadata::get_launcher_manifest;
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};

use crate::event;
pub use utils::ChannelMessage;
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

pub async fn install_minecraft(
    app: &AppState,
    config: InstallConfig,
    event_channel: &mpsc::Sender<ChannelMessage>,
) -> Result<Option<String>, LauncherError> {
    event!(&event_channel, "group", { "progress": 0, "max_progress": 9, "message": "Starting minecraft install." });

    let runtime_directory = app.get_path("path.app").await?.join("runtime");
    let version_directory = runtime_directory.join("versions").join(&config.version);
    event!(&event_channel,"update",{ "message": "Loading manifest" });
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

    let manifset = Manifest::read_manifest(&client_manfiest_file, false).await?;
    event!(&event_channel,"update",{ "progress": 1 });

    let java_version = manifset
        .java_version
        .ok_or(LauncherError::NotFound("Java not found".to_string()))?
        .major_version;

    if app.get_java(java_version).await?.is_none() {
        event!(&event_channel,"update",{ "message": "Installing Java" });
        let (build_version, path) =
            download_java(event_channel, &runtime_directory, java_version).await?;

        app.insert_java(java_version, &build_version, &path).await?;
    }

    event!(&event_channel,"update",{ "progress": 1, "message": "Downloading client" });
    tokio::try_join! {
        download_client(event_channel, &config.version, &version_directory, manifset.downloads),
        download_assets(event_channel, &runtime_directory, manifset.asset_index),
        download_libraries(event_channel,&runtime_directory,&config.version,manifset.libraries)
    }?;

    if config.loader != Loader::Vanilla {
        event!(&event_channel,"update",{ "message": "Installing Mod loader" });
        let java_exe = app
            .get_java(java_version)
            .await?
            .ok_or(LauncherError::NotFound(
                "Java executable was not found".to_string(),
            ))?;

        let version_id = match config.loader {
            Loader::Vanilla => {
                return Err(LauncherError::Generic("Should not be here".to_string()))
            }
            Loader::Neoforge => {
                forge::run_installer(
                    event_channel,
                    &config.version,
                    config.loader_version,
                    &runtime_directory,
                    &java_exe,
                    true,
                )
                .await?
            }
            Loader::Forge => {
                forge::run_installer(
                    event_channel,
                    &config.version,
                    config.loader_version,
                    &runtime_directory,
                    &java_exe,
                    false,
                )
                .await?
            }
            Loader::Fabric => {
                fabric::run_installer(
                    event_channel,
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
                    event_channel,
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
        event!(&event_channel,"update",{ "progress": 4 });
        Ok(None)
    }
}

#[cfg(test)]
mod tests {

    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_install_modded() {
        init();
        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir();
        let runtime_dir = runtime_directory.join("runtime");
        let java = runtime_dir.join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe");
        let app = AppState::new("sqlite::memory:").expect("Failed to make app");
        app.insert_setting(
            "path.app",
            None,
            runtime_directory.to_string_lossy().to_string(),
        )
        .await
        .expect("Failed to add settings");
        app.insert_java(21, "0.0.0", &java)
            .await
            .expect("Failed to insert");

        let config = InstallConfig {
            version: "1.20.6".to_string(),
            loader: Loader::Fabric,
            loader_version: None,
        };

        install_minecraft(&app, config, &tx)
            .await
            .expect("Failed to install minecraft");
    }

    #[tokio::test]
    async fn test_install() {
        init();

        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir();

        let app = AppState::new("sqlite::memory:").expect("Failed to make app");

        app.insert_setting(
            "path.app",
            None,
            runtime_directory.to_string_lossy().to_string(),
        )
        .await
        .expect("Failed to add settings");

        let config = InstallConfig {
            //app_directory: runtime_directory,
            version: "1.20.6".to_string(),
            loader: Loader::Vanilla,
            loader_version: None,
        };

        install_minecraft(&app, config, &tx)
            .await
            .expect("Failed to install minecraft");
    }
}
