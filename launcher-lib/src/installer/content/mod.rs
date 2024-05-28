mod mrpack;
use std::{path::PathBuf, str::FromStr};

use crate::{errors::LauncherError, event, installer::utils, AppState, ChannelMessage};

use futures::StreamExt;
pub use mrpack::install_mrpack;
use serde::Deserialize;
use tokio::fs;

#[derive(Debug, Deserialize)]
pub enum ContentType {
    Resourcepack,
    Shader,
    Mod,
    Modpack,
}

#[derive(Debug, Deserialize, Clone)]
pub struct InstallFile {
    pub sha1: String,
    pub url: String,
    pub version: String,
    pub filename: String,
    pub id: String,
}

#[derive(Debug, Deserialize)]
pub struct InstallContent {
    content_type: ContentType,
    profile: String,
    files: Vec<InstallFile>,
}

async fn download_files(
    output_direcotry: &std::path::Path,
    files: Vec<InstallFile>,
    event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    let result = futures::stream::iter(files.into_iter().map(|file| async move {
        let name = file
            .url
            .split('/')
            .last()
            .ok_or_else(|| LauncherError::NotFound("Failed to get file name".to_string()))?;
        let file_dir = output_direcotry.join(name);
        utils::download_file(&file.url, &file_dir, None, Some(&file.sha1)).await?;

        event!(&event_channel,"update",{ "progress": 1 });

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
    icon: Option<String>,
    event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    event!(&event_channel, "group", { "progress": 0, "max_progress": 1, "message": "Starting content install" });
    let root = app.get_path("path.app").await?;

    let profile_direcotry = root.join("profiles").join(&config.profile);

    match config.content_type {
        ContentType::Resourcepack => {
            let resource_packs = profile_direcotry.join("resourcepacks");

            if !resource_packs.exists() {
                fs::create_dir_all(&resource_packs).await?;
            }
            event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });

            download_files(&resource_packs, config.files.clone(), event_channel).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Resourcepack')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&app.database.0).await?;
            }

            Ok(())
        }
        ContentType::Shader => {
            let shader_directory = profile_direcotry.join("shaderpacks");

            if !shader_directory.exists() {
                fs::create_dir_all(&shader_directory).await?;
            }
            event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });
            download_files(&shader_directory, config.files.clone(), event_channel).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Shader')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&app.database.0).await?;
            }

            Ok(())
        }
        ContentType::Mod => {
            let mod_direcotry = profile_direcotry.join("mods");

            if !mod_direcotry.exists() {
                fs::create_dir_all(&mod_direcotry).await?;
            }
            event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });
            download_files(&mod_direcotry, config.files.clone(), event_channel).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Mod')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&app.database.0).await?;
            }

            Ok(())
        }

        ContentType::Modpack => {
            let file = config.files.first().ok_or_else(|| {
                LauncherError::NotFound("Missing download mrpack file".to_string())
            })?;
            let mut from_path = false;
            let file_path = if file.url.starts_with("https://") {
                let id = uuid::Uuid::new_v4();
                let temp = std::env::temp_dir().join(format!("{id}.mrpack"));
                event!(&event_channel, "group", { "progress": 0, "max_progress": 1, "message": "Downloading Files" });
                utils::download_file(&file.url, &temp, None, Some(&file.sha1)).await?;
                event!(&event_channel,"update",{ "progress": 1 });

                temp
            } else {
                from_path = true;
                let item = PathBuf::from_str(&file.url)
                    .map_err(|_| LauncherError::Generic("Failed to parse path".to_string()))?;

                if !(item.exists() && item.is_file()) {
                    return Err(LauncherError::NotFound(format!(
                        "No file found at: {}",
                        item.to_string_lossy()
                    )));
                }

                item
            };

            event!(&event_channel, "group", { "progress": 0, "max_progress": 5, "message": "Installing Mrpack" });
            if let Err(err) =
                mrpack::install_mrpack(app, event_channel, &file_path, icon, config.profile, &root)
                    .await
            {
                if !from_path {
                    tokio::fs::remove_file(&file_path).await?;
                }
                tokio::fs::remove_dir_all(&profile_direcotry).await?;
                return Err(err);
            }

            if !from_path {
                tokio::fs::remove_file(&file_path).await?;
            }

            Ok(())
        }
    }
}
