mod metadata;
pub mod utils;
use std::path::PathBuf;

use crate::event;
use crate::{errors::LauncherError, state::AppState};
use metadata::get_launcher_manifest;
use normalize_path::NormalizePath;
use serde::Deserialize;
use tokio::sync::mpsc;
use utils::ChannelMessage;
#[derive(Debug, Deserialize)]
pub struct InstallConfig {
    profile_name: String,
    app_directory: PathBuf,
    version: String,
}

/***
 * Install Events
 *
 * Structure
 *      type: String,
 *      payload: object
 *  Types
 *
 *
 *
 */

pub async fn install_minecraft(
    app: &mut AppState,
    config: InstallConfig,
    event_channel: mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    event!(&event_channel, "download", { "type": "status", "payload": { "message": "Starting minecraft install." } });

    let profile_dir = config.app_directory.join(config.profile_name);
    let runtime_dir = config.app_directory.join("runtime");

    let launcher_manifest = get_launcher_manifest(Some(&config.version)).await?;

    let client_jar_name = format!("{}.jar", launcher_manifest.id);
    let client_jar = runtime_dir
        .join("versions")
        .join(&launcher_manifest.id)
        .join(&client_jar_name)
        .normalize();
    let client_json = runtime_dir
        .join("versions")
        .join(&launcher_manifest.id)
        .join(format!("{}.json", launcher_manifest.id))
        .normalize();

    event!(&event_channel, "download", { "type": "download", "payload": { "message": "Version Manifest", "file": client_jar_name, "size":  } });

    Ok(())
}
