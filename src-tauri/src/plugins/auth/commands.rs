use super::desktop::{AuthAppState, AUTHORITY_ROOT, EVENT_LOGIN_WINDOW_DESTORYED};
use crate::error::Result;
use tauri::{Emitter, Manager, State, Url, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[tauri::command]
pub async fn logout<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Result<()> {
    let _logout_url = format!(
        "{}/oauth2/v2.0/logout?post_logout_redirect_uri=rmcl%3A%2F%2Fms%2Flogout",
        AUTHORITY_ROOT
    );
    Ok(())
}

#[tauri::command]
pub async fn authenticate<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: State<'_, AuthAppState>,
    scopes: Vec<oauth2::Scope>,
) -> Result<bool> {
    if let Some(window) = app.get_webview_window("login") {
        if let Err(err) = window.close() {
            log::error!("{}", err);
        }
    }

    let mut sl = state.lock().await;
    let url = sl.generate_url(scopes)?;

    let u = Url::parse(&url)?;

    let window = WebviewWindowBuilder::new(&app, "login", WebviewUrl::External(u))
        .title("Login")
        .inner_size(484.0, 600.0)
        .focused(true)
        .center()
        .build()?;

    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            if let Err(err) = handle.emit(EVENT_LOGIN_WINDOW_DESTORYED, true) {
                log::error!("{}", err);
            };
        }
    });

    Ok(true)
}
