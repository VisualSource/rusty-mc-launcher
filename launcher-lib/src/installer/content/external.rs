use super::{ContentType, InstallContent};
use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::{
        compression,
        utils::{self, get_file_hash, REQUEST_CLIENT},
    },
    models::{profile::Loader, setting::Setting},
};
use futures::StreamExt;
use normalize_path::NormalizePath;
use serde::Deserialize;
use std::{os::windows::fs::MetadataExt, path::PathBuf, str::FromStr, time::Duration};
use urlencoding::encode;
use uuid::Uuid;

pub async fn install_external(
    db: &crate::database::Database,
    src: PathBuf,
    profile: String,
    content_type: ContentType,
) -> Result<()> {
    let root = Setting::path("path.app", db)
        .await?
        .ok_or_else(|| Error::NotFound("Application path not found.".to_string()))?;

    let profile_dir = root.join("profiles").join(&profile);

    let content_dir = match content_type {
        ContentType::Resourcepack => profile_dir.join("resourcepacks"),
        ContentType::Shader => profile_dir.join("shaderpacks"),
        ContentType::Mod => profile_dir.join("mods"),
        ContentType::Modpack => {
            return Err(Error::Generic(
                "Modpack content is not supported".to_string(),
            ))
        }
    };

    let filename_temp = src.clone();
    let filename = filename_temp
        .file_name()
        .ok_or_else(|| Error::Generic("Failed to get filename".to_string()))?
        .to_string_lossy()
        .to_string();

    let output_filepath = content_dir.join(&filename);
    if output_filepath.exists() {
        return Err(Error::Generic("File already exists.".to_string()));
    }

    // copy to dir
    tokio::fs::copy(src, &output_filepath).await?;
    // gen hash
    let hash = get_file_hash(&output_filepath).await?;
    let content_name = content_type.as_string();

    // add to content list
    sqlx::query!(
        "INSERT INTO profile_content (id,sha1,profile,file_name,type) VALUES (?,?,?,?,?)",
        "",
        hash,
        profile,
        filename,
        content_name
    )
    .execute(&db.0)
    .await?;

    Ok(())
}

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
struct CFProject {
    files: Vec<CFProjectFile>,
    title: String,
    #[serde(rename = "type")]
    project_type: String,
}
#[derive(Debug, Deserialize)]
struct CFProjectFile {
    id: usize,
    filesize: u64,
    name: String,
}

pub async fn install_curseforge_modpack(
    db: &crate::database::Database,
    config: InstallContent,
    on_event: &tauri::ipc::Channel<DownloadEvent>,
) -> Result<()> {
    //event!(&event_channel, "group", { "progress": 0, "max_progress": 1, "message": "Starting content install" });
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

    tokio::time::sleep(Duration::from_secs(2)).await;

    //event!(&event_channel, "group", { "progress": 0, "max_progress": 5, "message": "Installing Curseforge modpack" });

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
    //TODO: Download Section
    //event!(&event_channel, "group", { "progress": 0, "max_progress": pack.files.len(), "message": "Downloading files" });
    let downloads = futures::stream::iter(pack.files.into_iter().map(|file| {
        let dir = profile_direcotry.clone();
        async move {
            let project_url = format!("https://api.cfwidget.com/{}", file.project_id);

            let response = REQUEST_CLIENT
                .request(reqwest::Method::GET, project_url)
                .send()
                .await?;

            let mut project: CFProject = response.json().await?;

            let content_type = match project.project_type.as_str() {
                "Mods" => "mods",
                "Resource Packs" => "resourcepacks",
                "Customization" | "Shaders" => "shaderpacks",
                _ => {
                    return Err(Error::Generic(format!(
                        "Unable to determine content type for {}",
                        project.title
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

    for file in downloads {
        match file {
            Ok(content) => {
                let content_type = match content.2.as_str() {
                    "mods" => "Mod",
                    "resourcepacks" => "Resourcepack",
                    "shaderpacks" => "Shader",
                    _ => "Unknown",
                };

                let profile_id = config.profile.clone();
                sqlx::query!("INSERT INTO profile_content (id,sha1,profile,file_name,type) VALUES (?,?,?,?,?)","",content.1,profile_id,content.0, content_type).execute(&db.0).await?;
            }
            Err(err) => return Err(err),
        }
    }
    // TODO: Download section
    //event!(&event_channel, "group", { "progress": 0, "max_progress": 6, "message": "Finalizing" });

    compression::extract_dir(
        &mut archive,
        &pack.overrides,
        &profile_direcotry,
        // TODO: use pack.overrides prop to replace the file path rather then have it had coded
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
    sqlx::query!("INSERT INTO download_queue ('id','display','install_order','display_name','profile_id','created','content_type','metadata','state') VALUES (?,?,?,?,?,current_timestamp,?,?,'PENDING')",
        queue_id,
        1,
        0,
        title,
        profile_id,
        "Client",
        metadata
    ).execute(&db.0).await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    let loader = modloader.to_string().to_lowercase();

    let pack_name = format!("{}: {}", pack.name, pack.version);
    sqlx::query!(
        "INSERT INTO profiles ('id','name','date_created','version','loader','loader_version','java_args','state') VALUES (?,?,current_timestamp,?,?,?,?,?);",
        profile_id,
        pack_name,
        pack.minecraft.version,
        loader,
        loader_version,
        "-Xmx4G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
        "INSTALLED"
    )
    .execute(&db.0)
    .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(1),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}
