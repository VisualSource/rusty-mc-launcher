use minecraft_launcher_lib::events::DownloadEvent;
use minecraft_launcher_lib::installer::content::{external, ContentType};
use minecraft_launcher_lib::models::queue::QueueType;
use tokio::sync::RwLock;

use std::path::PathBuf;
use std::sync::Mutex;
use tauri::ipc::Channel;
use tauri::State;

use crate::error::Error;

use super::EventChannel;

#[tauri::command]
pub async fn downloads_listener(
    state: State<'_, Mutex<EventChannel>>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), Error> {
    // do stuff pass on_event to caller
    let mut data = state.lock().map_err(|err| Error::Reason(err.to_string()))?;

    data.0 = Some(on_event);

    Ok(())
}

#[tauri::command]
pub async fn delete_profile(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
) -> Result<(), String> {
    /*let app_dir = state
        .get_path("path.app")
        .await?
        .join("profiles")
        .join(&profile);

    if app_dir.exists() {
        tokio::fs::remove_dir_all(&app_dir).await?;
    }
    Ok(())*/
    todo!("Update 'delete_profile'")
}

#[tauri::command]
pub async fn create_profile(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
    copy_options: Option<String>,
) -> Result<(), String> {
    /*let root_dir = state.get_path("path.app").await?.join("profiles");

    let new_profile = root_dir.join(&profile);

    if !root_dir.exists() {
        tokio::fs::create_dir_all(&new_profile).await?;
    }

    if let Some(options) = copy_options {
        let op = root_dir.join(options).join("options.txt");
        let out = new_profile.join("options.txt");
        if op.exists() && op.is_file() && !out.exists() {
            tokio::fs::copy(op, out).await?;
        }
    }

    Ok(())*/
    todo!("Update 'create_profile'")
}

#[tauri::command]
pub async fn uninstall_content(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    content_type: QueueType,
    filename: String,
    profile: String,
) -> Result<(), String> {
    /*let dir = match content_type {
        QueueType::Mod => "mods",
        QueueType::Resourcepack => "resourcepacks",
        QueueType::Shader => "shaderpacks",
        _ => return Err(Error::Generic("Can not uninstall content type".to_string())),
    };

    let file_path = state
        .get_path("path.app")
        .await?
        .join("profiles")
        .join(profile)
        .join(dir)
        .join(filename);

    if file_path.exists() && file_path.is_file() {
        tokio::fs::remove_file(&file_path).await?;
    }

    Ok(())*/
    todo!("Update 'uninstall_content'")
}

#[tauri::command]
pub async fn copy_profile(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
    new_profile: String,
) -> Result<(), String> {
    /*  let root = state.get_path("path.app").await?.join("profiles");

    let a = root.join(profile);
    let b = root.join(new_profile);

    if !(a.exists() && a.is_dir()) {
        tokio::fs::create_dir_all(&a).await?;
    }
    if !(b.exists() && b.is_dir()) {
        tokio::fs::create_dir_all(&b).await?;
    }

    if let Err(err) = copy_dir::copy_dir(&a, &b) {
        log::error!("{}", err.to_string());
    }

    Ok(())*/
    todo!("Update 'copy_profile'")
}

#[tauri::command]
pub async fn import_external(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
    src: PathBuf,
    content_type: ContentType,
) -> Result<(), String> {
    // TODO: rework to use tauri channels

    /*if let Err(err) = external::install_external(&state, src, profile, content_type).await {
        log::error!("{}", err);
        return Err(err.into());
    }
    Ok(())*/
    todo!("Update 'import_external'")
}
