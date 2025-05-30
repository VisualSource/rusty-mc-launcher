use minecraft_launcher_lib::database::RwDatabase;
use minecraft_launcher_lib::events::DownloadEvent;
use minecraft_launcher_lib::installer::content::ContentType;
use minecraft_launcher_lib::installer::content::file;
use minecraft_launcher_lib::models::queue::QueueType;
use tokio::sync::RwLock;

use std::path::PathBuf;
use tauri::State;
use tauri::ipc::Channel;
use tokio::sync::Mutex;

use crate::error::Error;
/// function to register the download listener to the frontend
#[tauri::command]
pub async fn downloads_listener(
    state: State<'_, Mutex<Option<Channel<DownloadEvent>>>>,
    on_event: Channel<DownloadEvent>,
) -> Result<(), Error> {
    // do stuff pass on_event to caller
    let mut data = state.lock().await;

    *data = Some(on_event);

    Ok(())
}

#[tauri::command]
pub async fn delete_profile(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
) -> Result<(), Error> {
    let app_dir = db
        .read()
        .await
        .get_setting_as_path("path.app")
        .await?
        .join("profiles")
        .join(&profile);

    if app_dir.exists() {
        tokio::fs::remove_dir_all(&app_dir).await?;
    }
    Ok(())
}

/// Creates profile folder in profiles dir and copies options.txt from another
/// profile if given profile id
#[tauri::command]
pub async fn create_profile(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    profile: String,
    copy_from: Option<std::path::PathBuf>,
) -> Result<(), Error> {
    let root_dir = db
        .read()
        .await
        .get_setting_as_path("path.app")
        .await?
        .join("profiles");

    let new_profile = root_dir.join(&profile);

    if !root_dir.exists() {
        tokio::fs::create_dir_all(&new_profile).await?;
    }

    if let Some(options) = copy_from {
        if !options.ends_with("options.txt") {
            return Err(Error::Reason("Invalid options file".into()));
        }
        if !options.exists() || !options.is_file() {
            return Err(Error::Reason(
                "Provided option file is not a file or does not exist".into(),
            ));
        }

        let out = new_profile.join("options.txt");
        if !out.exists() {
            tokio::fs::copy(options, out).await?;
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn uninstall_content(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    content: QueueType,
    filename: String,
    profile: String,
) -> Result<(), Error> {
    let dir = match content {
        QueueType::Mod => "mods",
        QueueType::Resourcepack => "resourcepacks",
        QueueType::Shader => "shaderpacks",
        _ => return Err(Error::Reason("Can not uninstall content type".to_string())),
    };

    let file_path = db
        .read()
        .await
        .get_setting_as_path("path.app")
        .await?
        .join("profiles")
        .join(profile)
        .join(dir)
        .join(filename);

    if file_path.exists() && file_path.is_file() {
        tokio::fs::remove_file(&file_path).await?;
    }

    Ok(())
}

/// copy file of a profile into a new profile
#[tauri::command]
pub async fn copy_profile(
    db: tauri::State<'_, RwDatabase>,
    old_profile: String,
    new_profile: String,
) -> Result<(), Error> {
    let root = {
        db.read()
            .await
            .get_setting_as_path("path.app")
            .await?
            .join("profiles")
    };

    let old = root.join(old_profile);
    let new = root.join(new_profile);

    if !(new.exists() && new.is_dir()) {
        tokio::fs::create_dir_all(&new).await?;
    }

    // old dir does not exist or not a dir
    // so just ignore
    if !(old.is_dir() && old.exists()) {
        return Ok(());
    }

    if let Err(err) = copy_dir::copy_dir(&old, &new) {
        log::error!("{}", err);
    }

    Ok(())
}

#[tauri::command]
pub async fn import_external(
    db: tauri::State<'_, RwDatabase>,
    profile: String,
    src: PathBuf,
    content_type: ContentType,
) -> Result<(), Error> {
    if let Err(err) = file::install_file(&db, src, profile, content_type).await {
        log::error!("{}", err);
        return Err(Error::Lib(err));
    }
    Ok(())
}

#[tauri::command]
pub async fn get_system_ram() -> u64 {
    minecraft_launcher_lib::utils::get_ram_gb()
}
