use super::desktop::{AUTHORITY, AuthAppState, EVENT_LOGIN_WINDOW_DESTORYED};
use crate::{error::Result, plugins::auth::desktop::AuthResponse};
use tauri::{Emitter, Manager, State, WebviewUrl, WebviewWindowBuilder, WindowEvent};

#[tauri::command]
pub async fn logout<R: tauri::Runtime>(_app: tauri::AppHandle<R>) -> Result<()> {
    let _logout_url = format!(
        "{}/oauth2/v2.0/logout?post_logout_redirect_uri=rmcl%3A%2F%2Fms%2Flogout",
        AUTHORITY
    );
    Ok(())
}

#[tauri::command]
pub async fn refresh(state: State<'_, AuthAppState>, token: String) -> Result<AuthResponse> {
    let sl = state.lock().await;
    sl.refresh(&token).await
}

#[tauri::command]
pub async fn authenticate<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: State<'_, AuthAppState>,
    scopes: Vec<openidconnect::Scope>,
) -> Result<bool> {
    if let Some(window) = app.get_webview_window("login") {
        if let Err(err) = window.close() {
            log::error!("{}", err);
        }
    }

    let mut sl = state.lock().await;
    let url = sl.generate_url(scopes)?;

    let window = WebviewWindowBuilder::new(&app, "login", WebviewUrl::External(url))
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

//const MODRINTH_SCOPES: &str = "NOTIFICATION_READ+NOTIFICATION_WRITE+USER_READ+USER_WRITE";
//const EVENT_MODRINTH_LOGIN_WINDOW_DISTORYED: &str = "rmcl-auth-modrinth-login-window-destoryed";

/*#[tauri::command]
pub async fn modrinth_authenticate<R: tauri::Runtime>(app: tauri::AppHandle<R>) -> Result<bool> {
    if let Some(window) = app.get_webview_window("modrinth-login") {
        if let Err(err) = window.close() {
            log::error!("{}", err);
        }
    }

    let auth_endpoint = format!(
        "{}/auth/authorize?client_id={}&redirect_uri={}&scope={}",
        MODRINTH_ENDPOINT, MODRINTH_CLIENT_ID, MODRINTH_CALLBACK_URI, MODRINTH_SCOPES
    );
    let url = Url::parse(&auth_endpoint)?;

    let window = WebviewWindowBuilder::new(&app, "modrinth-login", WebviewUrl::External(url))
        .title("Modrinth Login")
        .inner_size(484.0, 600.0)
        .focused(true)
        .center()
        .build()?;

    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            if let Err(err) = handle.emit(EVENT_MODRINTH_LOGIN_WINDOW_DISTORYED, ()) {
                log::error!("{}", err);
            };
        }
    });

    Ok(true)
}*/
