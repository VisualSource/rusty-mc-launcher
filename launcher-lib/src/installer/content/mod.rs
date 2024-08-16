pub mod external;
mod mrpack;
use std::{path::PathBuf, str::FromStr};

use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::utils,
    models::setting::Setting,
};

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

impl ContentType {
    pub fn as_string(&self) -> String {
        match self {
            ContentType::Resourcepack => "Resourcepack".to_string(),
            ContentType::Shader => "Shader".to_string(),
            ContentType::Mod => "Mod".to_string(),
            ContentType::Modpack => "Modpack".to_string(),
        }
    }
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
    on_event: &tauri::ipc::Channel<DownloadEvent>,
) -> Result<()> {
    let result = futures::stream::iter(files.into_iter().map(|file| async move {
        let name = file
            .url
            .split('/')
            .last()
            .ok_or_else(|| Error::NotFound("Failed to get file name".to_string()))?;
        let file_dir = output_direcotry.join(name);
        utils::download_file(&file.url, &file_dir, None, Some(&file.sha1)).await?;

        //TODO: clonable on_event?
        //event!(&event_channel,"update",{ "progress": 1 });

        Ok(())
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<()>>>()
    .await;
    if result.iter().any(|e| e.is_err()) {
        result.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(Error::Generic("Failed to download libraries".to_string()));
    }

    Ok(())
}

pub async fn install_content(
    config: InstallContent,
    icon: Option<String>,
    db: &crate::database::Database,
    on_event: &tauri::ipc::Channel<DownloadEvent>,
) -> Result<()> {
    on_event
        .send(crate::events::DownloadEvent::Started {
            max_progress: 1,
            message: "Starting content install".to_string(),
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let root = Setting::path("path.app", db)
        .await?
        .ok_or_else(|| Error::NotFound("Failed to get application path.".to_string()))?;

    let profile_direcotry = root.join("profiles").join(&config.profile);

    match config.content_type {
        ContentType::Resourcepack => {
            let resource_packs = profile_direcotry.join("resourcepacks");

            if !resource_packs.exists() {
                fs::create_dir_all(&resource_packs).await?;
            }
            // TODO: Download event Sections
            //event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });

            download_files(&resource_packs, config.files.clone(), on_event).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Resourcepack')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&db.0).await?;
            }

            Ok(())
        }
        ContentType::Shader => {
            let shader_directory = profile_direcotry.join("shaderpacks");

            if !shader_directory.exists() {
                fs::create_dir_all(&shader_directory).await?;
            }
            // TODO: download sections?
            // event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });
            download_files(&shader_directory, config.files.clone(), on_event).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Shader')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&db.0).await?;
            }

            Ok(())
        }
        ContentType::Mod => {
            let mod_direcotry = profile_direcotry.join("mods");

            if !mod_direcotry.exists() {
                fs::create_dir_all(&mod_direcotry).await?;
            }
            //TODO: download sections?
            //event!(&event_channel, "group", { "progress": 0, "max_progress": config.files.len(), "message": "Downloading Files" });
            download_files(&mod_direcotry, config.files.clone(), on_event).await?;

            for item in config.files {
                sqlx::query("INSERT INTO profile_content ('id','sha1','profile','file_name','version','type') VALUES (?,?,?,?,?,'Mod')")
                .bind(item.id).bind(item.sha1).bind(&config.profile).bind(item.filename).bind(item.version).execute(&db.0).await?;
            }

            Ok(())
        }

        ContentType::Modpack => {
            let file = config
                .files
                .first()
                .ok_or_else(|| Error::NotFound("Missing download mrpack file".to_string()))?;
            let mut from_path = false;
            let file_path = if file.url.starts_with("https://") {
                let id = uuid::Uuid::new_v4();
                let temp = std::env::temp_dir().join(format!("{id}.mrpack"));
                //TODO: download sections
                //event!(&event_channel, "group", { "progress": 0, "max_progress": 1, "message": "Downloading Files" });
                utils::download_file(&file.url, &temp, None, Some(&file.sha1)).await?;

                on_event
                    .send(crate::events::DownloadEvent::Progress {
                        amount: Some(1),
                        message: None,
                    })
                    .map_err(|err| Error::Generic(err.to_string()))?;

                temp
            } else {
                from_path = true;
                let item = PathBuf::from_str(&file.url)
                    .map_err(|_| Error::Generic("Failed to parse path".to_string()))?;

                if !(item.exists() && item.is_file()) {
                    return Err(Error::NotFound(format!(
                        "No file found at: {}",
                        item.to_string_lossy()
                    )));
                }

                item
            };
            // TODO: download sections
            //event!(&event_channel, "group", { "progress": 0, "max_progress": 5, "message": "Installing Mrpack" });
            if let Err(err) =
                mrpack::install_mrpack(db, on_event, &file_path, icon, config.profile, &root).await
            {
                if !from_path {
                    tokio::fs::remove_file(&file_path).await?;
                }
                //tokio::fs::remove_dir_all(&profile_direcotry).await?;
                return Err(err);
            }

            if !from_path {
                tokio::fs::remove_file(&file_path).await?;
            }

            Ok(())
        }
    }
}
