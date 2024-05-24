use crate::errors::Error;
use minecraft_launcher_lib::AppState;

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
