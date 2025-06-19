mod commands;
mod desktop;
mod mr_auth;
use tokio::sync::Mutex;

use desktop::{
    AuthAppState, AuthState, EVENT_LOGIN_WINDOW_DESTORYED, is_microsoft_callback, validate_code,
};
use tauri::{
    Emitter, Listener, Manager, Runtime,
    plugin::{Builder, TauriPlugin},
};
use tauri_plugin_deep_link::DeepLinkExt;

use crate::plugins::auth::mr_auth::{
    EVENT_MR_LOGIN_WINDOW_DESTORYED, ModrinthLoginState, is_modrinth_callback,
    validate_modrinth_code,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-auth")
        .setup(|app, _api| {
            log::debug!("Setup <rmcl-auth> plugin");

            let state = AuthState::new()?;
            app.manage(Mutex::new(state));
            app.manage(Mutex::new(ModrinthLoginState::new()));

            let app_handle = app.clone();
            app.listen(EVENT_LOGIN_WINDOW_DESTORYED, move |_event| {
                let handle = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(error) = handle.emit("rmcl-auth-login-error", "Window was closed") {
                        log::error!("{}", error);
                    }

                    let state = handle.state::<AuthAppState>();
                    let mut auth_state = state.lock().await;
                    auth_state.flow = None;
                });
                log::debug!("Login window has been destoryed");
            });

            let mr_app_handle = app.clone();
            app.listen(EVENT_MR_LOGIN_WINDOW_DESTORYED, move |_ev| {
                let handle = mr_app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    if let Err(error) = handle.emit("rmcl-auth-login-mr-error", "Window was closed")
                    {
                        log::error!("{}", error);
                    }
                    let state = handle.state::<Mutex<ModrinthLoginState>>();
                    let mut auth_state = state.lock().await;
                    if let Err(err) = auth_state.reset() {
                        log::error!("{}", err);
                    }
                });
            });

            let app_handle = app.clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                let opt_url = urls.first();
                if opt_url.is_none() {
                    return;
                }
                let url = opt_url.expect("There should have been a url in this");

                match url {
                    e if is_microsoft_callback(e) => {
                        let handle = app_handle.clone();
                        let data = url.clone();
                        tauri::async_runtime::spawn(async {
                            if let Err(err) = validate_code(handle, data).await {
                                log::error!("{}", err);
                            }
                        });
                    }
                    e if is_modrinth_callback(e) => {
                        let handle = app_handle.clone();
                        let data = url.clone();
                        tauri::async_runtime::spawn(async move {
                            if let Err(err) = validate_modrinth_code(handle, data).await {
                                log::error!("{}", err);
                            }
                        });
                    }
                    _ => {}
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::refresh,
            commands::authenticate,
            commands::logout,
            mr_auth::mr_authenticate
        ])
        .build()
}
