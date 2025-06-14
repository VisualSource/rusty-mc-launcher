//! Mrpack Installer
//! The Modrinth modpack format (.mrpack) is a simple format that lets you store modpacks. This is the only format of modpack that can be uploaded to Modrinth.
//! This module handles the parsing and install of a mrpack
//!
//! The mrpack spec can be found here <https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack>

use normalize_path::NormalizePath;
use std::path::Path;
use uuid::Uuid;

use crate::{
    database::{Database, RwDatabase},
    error::{Error, Result},
    events::DownloadEvent,
    installer::{
        compression,
        utils::{self},
    },
    models::profile::Loader,
    utils::current_timestamp,
};
use futures::StreamExt;
use serde::Deserialize;
use tokio::fs::{self, File};

use super::{ModpackVersion, insert_bluk_profile_content};

const WHITELISTED_DOMAINS: [&str; 4] = [
    "https://cdn.modrinth.com",
    "https://github.com",
    "https://raw.githubusercontent.com",
    "https://gitlab.com", //"mediafilez.forgecdn.net", // breaks spec
];

#[derive(Debug, Deserialize, Clone)]
struct Hashs {
    sha1: String,
}

#[derive(Debug, Deserialize, Clone)]
struct Env {
    client: String,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct PackFile {
    path: String,
    hashes: Hashs,
    env: Option<Env>,
    downloads: Vec<String>,
}

#[derive(Debug, Deserialize)]
struct Dependencies {
    minecraft: String,
    forge: Option<String>,
    neoforge: Option<String>,
    #[serde(rename = "fabric-loader")]
    fabric_loader: Option<String>,
    #[serde(rename = "quilt-loader")]
    quilt_loader: Option<String>,
}

/// https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MrPack {
    format_version: usize,
    icon: Option<String>,
    version_id: String,
    name: String,
    files: Vec<PackFile>,
    dependencies: Dependencies,
}

type Emitter = tauri::ipc::Channel<DownloadEvent>;

pub struct PackData {
    name: String,
    version_id: String,
    icon: Option<String>,
    minecraft: String,
    loader: Loader,
    loader_version: Option<String>,
    files: Vec<PackFile>,
}

impl PackData {
    pub async fn insert_files_to_db(&self, db: &Database, profile_id: &str) -> Result<()> {
        let mut data = Vec::new();
        for file in &self.files {
            let path = Path::new(&file.path);

            let file_name = path
                .file_name()
                .ok_or_else(|| Error::NotFound("Failed to get file name".to_string()))?
                .to_string_lossy()
                .to_string();

            let parent = path
                .parent()
                .ok_or_else(|| Error::Generic("Failed to get path parent".to_string()))?
                .to_string_lossy();

            let content_type = match parent {
                e if e.starts_with("mods") => "Mod",
                e if e.starts_with("resourcepacks") => "Resourcepack",
                e if e.starts_with("shaderpacks") => "Shader",
                _ => "Unknown",
            }
            .to_string();

            data.push((
                String::new(),
                file.hashes.sha1.clone(),
                profile_id.to_owned(),
                file_name,
                content_type,
            ));
        }

        insert_bluk_profile_content(data, db).await?;

        Ok(())
    }
}

/// handle the core unpacking of the mrpack archive into the given profile directory
pub async fn unpack_mrpack(
    event: &Emitter,
    mrpack_path: &Path,
    output_directory: &Path,
    override_existing: bool,
) -> Result<PackData> {
    let mut archive = compression::open_archive(File::open(&mrpack_path).await?).await?;
    let pack = compression::parse_extract::<MrPack>(&mut archive, "modrinth.index.json").await?;

    if pack.format_version != 1 {
        return Err(Error::Generic(format!(
            "Pack Format Version {} is not supported",
            pack.format_version
        )));
    }

    if !output_directory.is_dir() {
        return Err(Error::Generic(
            "output directory is not a directory".to_string(),
        ));
    }
    if !output_directory.exists() {
        tokio::fs::create_dir_all(&output_directory).await?;
    }

    event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    // find all client files
    let files = pack
        .files
        .into_iter()
        .filter(|x| match &x.env {
            Some(env) => env.client != "unsupported",
            None => true,
        })
        .collect::<Vec<PackFile>>();

    let data_files = files.clone();
    event
        .send(crate::events::DownloadEvent::Started {
            max_progress: 100 + data_files.len(),
            message: "Installing Modpack".to_string(),
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let downloads = futures::stream::iter(files.into_iter().map(|file| async move {
        let source = file.downloads.first().ok_or(Error::NotFound(format!(
            "Failed to get download url for {}",
            file.path
        )))?;

        if !WHITELISTED_DOMAINS.iter().any(|x| source.starts_with(x)) {
            return Err(Error::Generic(format!(
                "Invalid download source: {}",
                source
            )));
        }

        let output = output_directory.join(&file.path).normalize();

        utils::download_file(source, &output, None, Some(&file.hashes.sha1)).await?;

        event
            .send(crate::events::DownloadEvent::Progress {
                amount: Some(1),
                message: None,
            })
            .map_err(|err| Error::Generic(err.to_string()))?;

        Ok(())
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<()>>>()
    .await;

    if downloads.iter().any(|e| e.is_err()) {
        downloads.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(Error::Generic("Failed to download file(s)".to_string()));
    }

    compression::extract_dir(
        &mut archive,
        "overrides",
        output_directory,
        Some(|file| file.replace("overrides", "")),
        override_existing,
    )
    .await?;

    event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    compression::extract_dir(
        &mut archive,
        "client-overrides",
        output_directory,
        Some(|file| file.replace("client-overrides", "")),
        override_existing,
    )
    .await?;

    event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let (modloader, loader_version) = if let Some(fabric) = pack.dependencies.fabric_loader {
        (Loader::Fabric, Some(fabric))
    } else if let Some(forge) = pack.dependencies.forge {
        (Loader::Forge, Some(forge))
    } else if let Some(quilt) = pack.dependencies.quilt_loader {
        (Loader::Quilt, Some(quilt))
    } else if let Some(v) = pack.dependencies.neoforge {
        (Loader::Neoforge, Some(v))
    } else {
        (Loader::Vanilla, None)
    };

    event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(PackData {
        name: pack.name,
        version_id: pack.version_id,
        minecraft: pack.dependencies.minecraft,
        icon: pack.icon,
        loader: modloader,
        loader_version,
        files: data_files,
    })
}

pub async fn install_mrpack(
    db: &RwDatabase,
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    mrpack_path: &Path,
    icon: Option<String>,
    profile_id: String,
    runtime_directory: &Path,
    project_id: Option<String>,
) -> Result<()> {
    let current_profile_dir = runtime_directory.join("profiles").join(&profile_id);
    if !current_profile_dir.exists() {
        fs::create_dir_all(&current_profile_dir).await?;
    }

    let pack = unpack_mrpack(on_event, mrpack_path, &current_profile_dir, false).await?;

    let title = format!(
        "Minecraft {} {} {}",
        pack.minecraft,
        pack.loader,
        pack.loader_version.clone().unwrap_or(String::new())
    );
    let metadata = serde_json::json!({
       "version": pack.minecraft,
       "loader": pack.loader,
       "loader_version": pack.loader_version.clone().unwrap_or(String::new())
    })
    .to_string();

    let queue_id = Uuid::new_v4().to_string();
    let icon = icon.or(pack.icon.clone());
    let cicon = icon.clone();

    let wdb = db.write().await;
    let timestamp = current_timestamp()?;
    sqlx::query!("INSERT INTO download_queue ('id','display','icon','priority','display_name','profile_id','created','content_type','metadata','state') VALUES (?,?,?,?,?,?,?,?,?,'PENDING')",
            queue_id,
            1,
            cicon,
            0,
            title,
            profile_id,
            timestamp,
            "Client",
            metadata
        ).execute(&wdb.0).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let loader = pack.loader.clone().to_string().to_lowercase();

    let pack_data = serde_json::to_string(&ModpackVersion::new(
        "modrinth_id".to_string(),
        pack.version_id.clone(),
        project_id,
    ))?;

    sqlx::query!(
        "INSERT INTO profiles ('id','name','icon','date_created','version','loader','loader_version','java_args','state','is_modpack') VALUES (?,?,?,current_timestamp,?,?,?,?,?,?);",
            profile_id,
            pack.name,
            icon,
            pack.minecraft,
            loader,
            pack.loader_version,
            "-Xmx4G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
            "INSTALLED",
            pack_data
        )
        .execute(&wdb.0)
        .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    pack.insert_files_to_db(&wdb, &profile_id).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(16),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}
