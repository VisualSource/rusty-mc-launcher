use normalize_path::NormalizePath;
use std::path::Path;
use uuid::Uuid;

use crate::{
    errors::LauncherError,
    event,
    installer::{
        compression,
        utils::{self, ChannelMessage},
    },
    profile::Loader,
    AppState,
};
use futures::StreamExt;
use serde::Deserialize;
use tokio::fs::{self, File};

const WHITELISTED_DOMAINS: [&str; 5] = [
    "cdn.modrinth.com",
    "github.com",
    "raw.githubusercontent.com",
    "gitlab.com",
    "mediafilez.forgecdn.net",
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
    //version_id: String,
    name: String,
    files: Vec<PackFile>,
    dependencies: Dependencies,
}

pub async fn install_mrpack(
    app: &AppState,
    event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
    mrpack_path: &Path,
    icon: Option<String>,
    profile_id: String,
    runtime_directory: &Path,
) -> Result<(), LauncherError> {
    let mut archive = compression::open_archive(File::open(&mrpack_path).await?).await?;

    let pack = compression::parse_extract::<MrPack>(&mut archive, "modrinth.index.json").await?;

    if pack.format_version != 1 {
        return Err(LauncherError::Generic(
            "Pack format is not supported".to_string(),
        ));
    }
    let current_profile_dir = runtime_directory.join("profiles").join(&profile_id);
    if !current_profile_dir.exists() {
        fs::create_dir_all(&current_profile_dir).await?;
    }

    event!(&event_channel,"update",{ "progress": 1 });

    // filter download for clients
    let files = pack
        .files
        .into_iter()
        .filter(|x| match &x.env {
            Some(env) => env.client != "unsupported",
            None => true,
        })
        .collect::<Vec<PackFile>>();

    let data_files = files.clone();
    event!(&event_channel, "group", { "progress": 0, "max_progress": data_files.len(), "message": "Downloading files" });
    let downloads = futures::stream::iter(files.into_iter().map(|file| {
        let dir = current_profile_dir.clone();
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

            let output = dir.join(&file.path).normalize();

            utils::download_file(source, &output, None, Some(&file.hashes.sha1)).await?;

            event!(&event_channel,"update",{ "progress": 1 });
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
    event!(&event_channel, "group", { "progress": 0, "max_progress": 6, "message": "Finalizing" });

    compression::extract_dir(
        &mut archive,
        "overrides",
        &current_profile_dir,
        Some(|file| file.replace("overrides", "")),
    )
    .await?;
    event!(&event_channel,"update",{ "progress": 1 });
    compression::extract_dir(
        &mut archive,
        "client-overrides",
        &current_profile_dir,
        Some(|file| file.replace("client-overrides", "")),
    )
    .await?;
    event!(&event_channel,"update",{ "progress": 1 });
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

    event!(&event_channel,"update",{ "progress": 1 });
    let title = format!(
        "Minecraft {} {} {}",
        pack.dependencies.minecraft,
        modloader,
        loader_version.clone().unwrap_or(String::new())
    );
    let metadata = serde_json::json!({
       "version": pack.dependencies.minecraft,
       "loader": modloader,
       "loader_version":loader_version.clone().unwrap_or(String::new())
    })
    .to_string();

    let queue_id = Uuid::new_v4().to_string();

    let icon = icon.or(pack.icon);

    let cicon = icon.clone();

    sqlx::query!("INSERT INTO download_queue ('id','display','icon','install_order','display_name','profile_id','created','content_type','metadata','state') VALUES (?,?,?,?,?,?,current_timestamp,?,?,'PENDING')",
        queue_id,
        1,
        cicon,
        0,
        title,
        profile_id,
        "Client",
        metadata
    ).execute(&app.database.0).await?;
    event!(&event_channel,"update",{ "progress": 1 });
    let loader = modloader.to_string().to_lowercase();
    sqlx::query!(
        "INSERT INTO profiles ('id','name','icon','date_created','version','loader','loader_version','java_args','state') VALUES (?,?,?,current_timestamp,?,?,?,?,?);",
        profile_id,
        pack.name,
        icon,
        pack.dependencies.minecraft,
        loader,
        loader_version,
        "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
        "INSTALLED"
    )
    .execute(&app.database.0)
    .await?;
    event!(&event_channel,"update",{ "progress": 1 });
    for file in data_files {
        let profile = profile_id.clone();
        let path = Path::new(&file.path);

        let file_name = path
            .file_name()
            .ok_or_else(|| LauncherError::NotFound("Failed to get file name".to_string()))?
            .to_string_lossy()
            .to_string();

        let parent = path
            .parent()
            .ok_or_else(|| LauncherError::Generic("Failed to get path parent".to_string()))?
            .to_string_lossy()
            .to_string();
        let content_type = if parent.starts_with("mods") {
            "Mod"
        } else if parent.starts_with("resourcepacks") {
            "Resourcepack"
        } else if parent.starts_with("shaderpacks") {
            "Shader"
        } else {
            "Unknown"
        };

        sqlx::query!(
            "INSERT INTO profile_content ('id','sha1','profile','file_name','type') VALUES (?,?,?,?,?);",
            "",
            file.hashes.sha1,
            profile,
            file_name,
            content_type,
        )
        .execute(&app.database.0)
        .await?;
    }
    event!(&event_channel,"update",{ "progress": 1 });
    Ok(())
}
