use super::desktop::{AuthAppState, AUTHORITY_ROOT};
use crate::error::Result;
use tauri::State;
use tauri_plugin_opener::OpenerExt;

#[tauri::command]
pub async fn logout<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Result<()> {
    app.opener().open_url(
        format!(
            "{}/oauth2/v2.0/logout?post_logout_redirect_uri=rmcl%3A%2F%2Fms%2Flogout",
            AUTHORITY_ROOT
        ),
        None::<&str>,
    )?;
    Ok(())
}

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
