mod mrpack;
use crate::{errors::LauncherError, installer::utils, manifest, AppState, ChannelMessage};

use futures::StreamExt;
pub use mrpack::install_mrpack;
use serde::Deserialize;
use tokio::fs;

#[derive(Debug, Deserialize)]
pub enum ContentType {
    Resourcepack,
    Shader,
    Mod,
    ModPack,
}

#[derive(Debug, Deserialize)]
pub struct InstallContent {
    content_type: ContentType,
    profile: String,
    files: Vec<manifest::File>,
}

async fn download_files(
    output_direcotry: &std::path::Path,
    files: Vec<manifest::File>,
) -> Result<(), LauncherError> {
    let result = futures::stream::iter(files.into_iter().map(|file| async move {
        let name = file
            .url
            .split('/')
            .last()
            .ok_or_else(|| LauncherError::NotFound("Failed to get file name".to_string()))?;
        let file_dir = output_direcotry.join(name);
        utils::download_file(&file.url, &file_dir, None, Some(&file.sha1)).await?;

        Ok(())
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(), LauncherError>>>()
    .await;
    if result.iter().any(|e| e.is_err()) {
        result.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(LauncherError::Generic(
            "Failed to download libraries".to_string(),
        ));
    }

    Ok(())
}

pub async fn install_content(
    app: &AppState,
    config: InstallContent,
    event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    let root = app.get_path("path.app").await?;

    let profile_direcotry = root.join("profiles").join(&config.profile);

    match config.content_type {
        ContentType::Resourcepack => {
            let resource_packs = profile_direcotry.join("resourcepacks");

            if !resource_packs.exists() {
                fs::create_dir_all(&resource_packs).await?;
            }
            download_files(&resource_packs, config.files).await
        }
        ContentType::Shader => {
            let shader_directory = profile_direcotry.join("shaderpacks");

            if !shader_directory.exists() {
                fs::create_dir_all(&shader_directory).await?;
            }

            download_files(&shader_directory, config.files).await
        }
        ContentType::Mod => {
            let mod_direcotry = profile_direcotry.join("mods");

            if !mod_direcotry.exists() {
                fs::create_dir_all(&mod_direcotry).await?;
            }

            download_files(&mod_direcotry, config.files).await
        }

        ContentType::ModPack => {
            let file = config.files.first().ok_or_else(|| {
                LauncherError::NotFound("Missing download mrpack file".to_string())
            })?;

            let id = uuid::Uuid::new_v4();
            let temp = std::env::temp_dir().join(format!("{id}.mrpack"));

            utils::download_file(&file.url, &temp, None, Some(&file.sha1)).await?;

            mrpack::install_mrpack(app, event_channel, &temp, config.profile, &root).await?;

            tokio::fs::remove_file(&temp).await?;

            Ok(())
        }
    }
}
