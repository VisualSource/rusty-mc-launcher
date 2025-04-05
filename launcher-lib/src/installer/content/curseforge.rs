//! ### Install a curseforge modpack from a zip file
//! Developed for version 1 and "minecraftModpack" type for the curseforge pack format.
//!
//! `Note that this function uses <https://api.cfwidget.com/> api to reslove
//! download urls for mods as curseforge does not provide a api for resloving mod project id's
//! the stibility of this method is unstable as the third party api may not work in the future`

use super::{InstallContent, ModpackVersion, insert_bluk_profile_content};
use crate::{
    database::RwDatabase,
    error::{Error, Result},
    events::DownloadEvent,
    installer::{
        compression,
        utils::{self, REQUEST_CLIENT, get_file_hash},
    },
    models::{profile::Loader, setting::Setting},
};
use futures::StreamExt;
use normalize_path::NormalizePath;
use serde::Deserialize;
use std::{os::windows::fs::MetadataExt, path::PathBuf, str::FromStr, time::Duration};
use tauri::Url;
use urlencoding::encode;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CurseforgeModpack {
    overrides: String,
    manifest_type: String,
    manifest_version: usize,
    name: String,
    version: String,
    files: Vec<CFMFile>,
    minecraft: CFMGameConfig,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
struct CFMGameConfig {
    version: String,
    mod_loaders: Vec<CFMLoader>,
}
#[derive(Debug, Deserialize)]
struct CFMLoader {
    id: String,
}

#[derive(Debug, Deserialize)]
struct CFMFile {
    #[serde(rename = "projectID")]
    project_id: usize,
    #[serde(rename = "fileID")]
    file_id: usize,
}

#[derive(Debug, Deserialize)]
struct CFProjectUrls {
    project: String,
}

#[derive(Debug, Deserialize)]
struct CFProject {
    urls: CFProjectUrls,
    files: Vec<CFProjectFile>,
    title: String,
    //version: String,
}
#[derive(Debug, Deserialize)]
struct CFProjectFile {
    id: usize,
    filesize: u64,
    name: String,
}

pub async fn install_curseforge_modpack(
    db: &RwDatabase,
    config: InstallContent,
    on_event: &tauri::ipc::Channel<DownloadEvent>,
) -> Result<()> {
    on_event
        .send(crate::events::DownloadEvent::Started {
            max_progress: 2,
            message: "Starting Download".to_string(),
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let root = Setting::path("path.app", db)
        .await?
        .ok_or_else(|| Error::NotFound("Application path not found.".to_string()))?;

    let profile_direcotry = root.join("profiles").join(&config.profile);
    if !profile_direcotry.exists() {
        tokio::fs::create_dir_all(&profile_direcotry).await?;
    }

    let file = config
        .files
        .first()
        .ok_or_else(|| Error::NotFound("Missing download mrpack file".to_string()))?;
    let modpack_archive = PathBuf::from_str(&file.url)
        .map_err(|_| Error::Generic("Failed to parse path".to_string()))?;

    if !(modpack_archive.exists() && modpack_archive.is_file()) {
        return Err(Error::NotFound(format!(
            "No file found at: {}",
            modpack_archive.to_string_lossy()
        )));
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let mut archive =
        compression::open_archive(tokio::fs::File::open(&modpack_archive).await?).await?;

    let pack =
        compression::parse_extract::<CurseforgeModpack>(&mut archive, "manifest.json").await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    if pack.manifest_version != 1 || pack.manifest_type != "minecraftModpack" {
        return Err(Error::Generic("Pack format is not supported".to_string()));
    }

    tokio::time::sleep(Duration::from_secs(2)).await;

    on_event
        .send(crate::events::DownloadEvent::Started {
            max_progress: pack.files.len() + 4,
            message: "Installing CurseForge Modpck".to_string(),
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let downloads = futures::stream::iter(pack.files.into_iter().map(|file| {
        let dir = profile_direcotry.clone();
        async move {
            let project_url = format!("https://api.cfwidget.com/{}", file.project_id);

            let response = REQUEST_CLIENT
                .request(reqwest::Method::GET, project_url)
                .send()
                .await?;

            let mut project: CFProject = response.json().await?;

            let project_url = Url::parse(&project.urls.project).map_err(|e|Error::Generic(e.to_string()))?;
            let project_content_type = project_url.path().split('/').filter(|e| !e.is_empty()).take(2).nth(1).unwrap_or("unknown");
            let content_type = match project_content_type {
                "mc-mods" => "mods",
                "texture-packs" => "resourcepacks",
                "shaders" => "shaderpacks",
                _ => {
                    return Err(Error::Generic(format!(
                        "Unable to determine content type for {}. Given {}",
                        project.title,
                        project_content_type
                    )))
                }
            };

            let content_dir = dir.join(content_type);

            project
                .files
                .sort_by(|a, b| a.id.partial_cmp(&b.id).unwrap());

            let project_file = project
                .files
                .binary_search_by(|prob| prob.id.cmp(&file.file_id))
                .map_err(|_| Error::Generic(format!("Failed to find project file, Project: {} File: {}",file.project_id,file.file_id)))?;

            let version = project
                .files
                .get(project_file)
                .ok_or_else(|| Error::Generic("Failed to get project file".to_string()))?;

            let output = content_dir.join(&version.name).normalize();

            let id_s = version.id.to_string();
            let url_a = id_s.get(0..4).ok_or_else(||Error::Generic("Failed to get first file id part".to_string()))?;
            let url_b = id_s.get(4..)
                .ok_or_else(||Error::Generic("Failed to get file id part 2".to_string()))?
                .parse::<u64>().map_err(|err|Error::Generic(format!("{}",err)))?;

            // https://mediafilez.forgecdn.net/files/5083/619/lambdynamiclights-2.3.4%2B1.20.4.jar
            let download_url = format!("https://mediafilez.forgecdn.net/files/{}/{}/{}",url_a,url_b, encode(&version.name));

            utils::download_file(&download_url, &output, None, None).await?;

            let file_meta = tokio::fs::metadata(&output).await?;
            let on_disk = file_meta.file_size();
            if on_disk != version.filesize {
                return Err(Error::Generic(format!(
                    "On disk file size does not match expected file size. {} bytes | {} bytes for {}",
                    on_disk, version.filesize, version.name
                )));
            }

            let hash = get_file_hash(&output).await?;

            on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

            tokio::time::sleep(Duration::from_secs(5)).await;
            Ok((version.name.clone(), hash, content_type.to_owned()))
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(String, String, String)>>>()
    .await;

    {
        let wdb = db.write().await;
        let mut data = Vec::new();
        for file in downloads {
            let profile_id = config.profile.clone();
            match file {
                Ok(content) => {
                    let content_type = match content.2.as_str() {
                        "mods" => "Mod",
                        "resourcepacks" => "Resourcepack",
                        "shaderpacks" => "Shader",
                        _ => "Unknown",
                    }
                    .to_string();

                    data.push((
                        String::new(),
                        content.1,
                        profile_id,
                        content.0,
                        content_type,
                    ));
                }
                Err(err) => return Err(err),
            }
        }

        insert_bluk_profile_content(data, &wdb).await?;
    }

    compression::extract_dir(
        &mut archive,
        &pack.overrides,
        &profile_direcotry,
        // TODO: use pack.overrides prop to replace the file path rather then have it hard coded
        Some(|file| file.replace("overrides", "")),
    )
    .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let (modloader, loader_version) = {
        let loaders = pack
            .minecraft
            .mod_loaders
            .first()
            .ok_or_else(|| Error::Generic("Failed to get pack modloader".to_string()))?;

        let item = loaders
            .id
            .split('-')
            .map(|e| e.to_owned())
            .collect::<Vec<String>>();
        let loader = match item[0].as_str() {
            "fabric" => Loader::Fabric,
            "forge" => Loader::Forge,
            "neoforge" => Loader::Neoforge,
            "quilt" => Loader::Quilt,
            _ => Loader::Vanilla,
        };

        (loader, item[1].clone())
    };

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let title = format!(
        "Minecraft {} {} {}",
        pack.minecraft.version, modloader, loader_version
    );
    let metadata = serde_json::json!({
       "version": pack.minecraft.version,
       "loader": modloader,
       "loader_version":loader_version
    })
    .to_string();

    let queue_id = Uuid::new_v4().to_string();
    let profile_id = config.profile.clone();

    let wdb = db.write().await;

    sqlx::query!("INSERT INTO download_queue ('id','display','priority','display_name','profile_id','created','content_type','metadata','state') VALUES (?,?,?,?,?,current_timestamp,?,?,'PENDING')",
        queue_id,
        1,
        0,
        title,
        profile_id,
        "Client",
        metadata
    ).execute(&wdb.0).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let loader = modloader.to_string().to_lowercase();

    let pack_name = format!("{}: {}", pack.name, pack.version);
    let pack_data = serde_json::to_string(&ModpackVersion::new(
        "curseforge_semver".to_string(),
        pack.version,
        None,
    ))?;

    sqlx::query!(
        "INSERT INTO profiles ('id','name','date_created','version','loader','loader_version','java_args','state','is_modpack') VALUES (?,?,current_timestamp,?,?,?,?,?,?);",
        profile_id,
        pack_name,
        pack.minecraft.version,
        loader,
        loader_version,
        "-Xmx4G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
        "INSTALLED",
        pack_data
    )
    .execute(&wdb.0)
    .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}
