use crate::errors::Error;
use minecraft_launcher_lib::{models::QueueType, AppState};

#[tauri::command]
pub async fn delete_profile(
    state: tauri::State<'_, AppState>,
    profile: String,
) -> Result<(), Error> {
    let app_dir = state
        .get_path("path.app")
        .await?
        .join("profiles")
        .join(&profile);

    if app_dir.exists() {
        tokio::fs::remove_dir_all(&app_dir).await?;
    }
    Ok(())
}

#[tauri::command]
pub async fn create_profile(
    state: tauri::State<'_, AppState>,
    profile: String,
) -> Result<(), Error> {
    let app_dir = state
        .get_path("path.app")
        .await?
        .join("profiles")
        .join(&profile);

    if !app_dir.exists() {
        tokio::fs::create_dir_all(app_dir).await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn uninstall_content(
    state: tauri::State<'_, AppState>,
    content_type: QueueType,
    filename: String,
    profile: String,
) -> Result<(), Error> {
    let dir = match content_type {
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

    Ok(())
}
