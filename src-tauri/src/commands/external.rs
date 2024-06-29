use crate::errors::Error;
use minecraft_launcher_lib::content::{external, ContentType};
use minecraft_launcher_lib::AppState;
use std::path::PathBuf;

#[tauri::command]
pub async fn import_external(
    state: tauri::State<'_, AppState>,
    profile: String,
    src: PathBuf,
    content_type: ContentType,
) -> Result<(), Error> {
    if let Err(err) = external::install_external(&state, src, profile, content_type).await {
        log::error!("{}", err);
        return Err(err.into());
    }
    Ok(())
}
