use std::path::Path;

use crate::{
    errors::LauncherError,
    install_minecraft,
    installer::{
        compression,
        utils::{self, ChannelMessage},
        InstallConfig,
    },
    AppState,
};
use futures::StreamExt;
use serde::Deserialize;
use tokio::fs::File;

const WHITELISTED_DOMAINS: [&str; 4] = [
    "cdn.modrinth.com",
    "github.com",
    "raw.githubusercontent.com",
    "gitlab.com",
];

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
struct MRPack {
    format_version: usize,
    summary: Option<String>,
    game: String,
    version_id: String,
    name: String,
    files: Vec<PackDownload>,
    dependencies: Dependencies,
}

pub async fn install_mrpack(
    app: &AppState,
    event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
    mrpack_path: &Path,
    profile_id: String,
    runtime_directory: &Path,
) -> Result<(), LauncherError> {
    let mut archive = compression::open_archive(File::open(&mrpack_path).await?).await?;

    let pack = compression::parse_extract::<MRPack>(&mut archive, "modrinth.index.json").await?;

    if pack.format_version != 1 {
        return Err(LauncherError::Generic(
            "Pack format is not supported".to_string(),
        ));
    }

    let profile_id = uuid::Uuid::new_v4();

    let current_profile_dir = app.get_path("key.app").await?.join(profile_id.to_string());

    let mods_directory = current_profile_dir.join("mods");

    // filter download for clients

    let files = pack.files.into_iter().filter(|x| match &x.env {
        Some(env) => env.client != "unsupported",
        None => true,
    });

    let downloads = futures::stream::iter(files.map(|file| {
        let dir = mods_directory.clone();
        async move {
            let source = file
                .downloads
                .first()
                .ok_or(LauncherError::NotFound(format!(
                    "Failed to get download url for {}",
                    file.path
                )))?;

            if !WHITELISTED_DOMAINS
                .iter()
                .any(|x| source.starts_with(&format!("https://{}", x)))
            {
                return Err(LauncherError::Generic(
                    "Invalid download source".to_string(),
                ));
            }

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

    compression::extract_dir(
        &mut archive,
        "overrides",
        &current_profile_dir,
        Some(|file| file.replace("overrides", "")),
    )
    .await?;

    compression::extract_dir(
        &mut archive,
        "client-overrides",
        &current_profile_dir,
        Some(|file| file.replace("client-overrides", "")),
    )
    .await?;

    //let install_config = InstallConfig::new()

    //install_minecraft(app, config, event_channel)

    //install_minecraft(app, config, event_channel)

    unimplemented!()
}
