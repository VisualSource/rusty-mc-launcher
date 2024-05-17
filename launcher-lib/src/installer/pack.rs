use crate::{
    errors::LauncherError,
    install_minecraft,
    installer::{
        compression::{self, extract_dir},
        utils,
    },
    manifest,
};
use futures::StreamExt;
use serde::Deserialize;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};
use tokio::fs::File;

#[derive(Debug, Deserialize)]
enum ContentType {
    Resource,
    Shader,
    Mod,
}

#[derive(Debug, Deserialize)]
pub struct InstallContent {
    pack_type: ContentType,
    profile_directory: PathBuf,
    file: manifest::File,
}

pub async fn install_content(config: InstallContent) -> Result<(), LauncherError> {
    unimplemented!()
}

#[derive(Debug, Deserialize)]
struct Hashs {
    sha1: String,
}

#[derive(Debug, Deserialize)]
struct Env {
    client: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackDownload {
    path: String,
    hashes: Hashs,
    env: Option<Env>,
    downloads: Vec<String>,
    file_size: usize,
}

/// https://support.modrinth.com/en/articles/8802351-modrinth-modpack-format-mrpack
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct MRPack {
    format_version: usize,
    summary: Option<String>,
    game: String,
    version_id: String,
    name: String,
    files: Vec<PackDownload>,
    dependencies: HashMap<String, String>,
}

pub async fn install_mrpack(filepath: &Path) -> Result<(), LauncherError> {
    let mut archive = compression::open_archive(File::open(&filepath).await?).await?;

    let pack = compression::parse_extract::<MRPack>(&mut archive, "modrinth.index.json").await?;

    if pack.format_version != 1 {
        return Err(LauncherError::Generic(
            "Pack format is not supported".to_string(),
        ));
    }

    let profile_directory = PathBuf::new();

    let mod_dir = profile_directory.join("mods");

    let downloads = futures::stream::iter(pack.files.into_iter().map(|file| {
        let dir = mod_dir.clone();
        async move {
            let source = file
                .downloads
                .first()
                .ok_or(LauncherError::NotFound(format!(
                    "Failed to get download url for {}",
                    file.path
                )))?;
            utils::download_file(source, &dir, None, Some(&file.hashes.sha1)).await?;
            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(), LauncherError>>>()
    .await;

    if downloads.iter().any(|e| e.is_err()) {
        downloads.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(LauncherError::Generic(
            "Failed to download libraries".to_string(),
        ));
    }

    extract_dir(
        &mut archive,
        "overrides",
        &profile_directory,
        Some(|file| file.replace("overrides", "")),
    )
    .await?;

    extract_dir(
        &mut archive,
        "client-overrides",
        &profile_directory,
        Some(|file| file.replace("client-overrides", "")),
    )
    .await?;

    //install_minecraft(app, config, event_channel)

    unimplemented!()
}
