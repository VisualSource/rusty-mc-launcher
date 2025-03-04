use super::desktop::AuthAppState;
use crate::error::Result;
use tauri::State;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub async fn authenticate<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: State<'_, AuthAppState>,
    scopes: Vec<oauth2::Scope>,
) -> Result<bool> {
    let mut sl = state.lock().await;
    let url = sl.generate_url(scopes)?;

    app.opener().open_url(url, None::<&str>)?;

    Ok(true)
}
