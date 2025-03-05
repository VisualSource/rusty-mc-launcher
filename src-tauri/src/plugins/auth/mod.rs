mod commands;
mod desktop;
use tokio::sync::Mutex;

use desktop::{
    is_valid_callback, validate_code, AuthAppState, AuthState, EVENT_LOGIN_WINDOW_DESTORYED,
};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Listener, Manager, Runtime,
};
use tauri_plugin_deep_link::DeepLinkExt;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-auth")
        .setup(|app, _api| {
            log::debug!("Setup <rmcl-auth> plugin");

            let state = AuthState::new()?;
            app.manage(Mutex::new(state));

            let app_handle = app.clone();
            app.listen(EVENT_LOGIN_WINDOW_DESTORYED, move |_event| {
                let handle = app_handle.clone();
                tauri::async_runtime::spawn(async move {
                    let state = handle.state::<AuthAppState>();
                    let mut auth_state = state.lock().await;
                    auth_state.flow = None;
                });
                log::debug!("Login window has been destoryed");
            });

            let app_handle = app.clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                let opt_url = urls.first();
                if opt_url.is_none() {
                    return;
                }
                let url = opt_url.expect("There should have been a url in this");

                log::debug!("{:#?}", url);

                if !is_valid_callback(url) {
                    return;
                }

                if let Some(win) = app_handle.get_webview_window("login") {
                    if let Err(err) = win.close() {
                        log::error!("{}", err);
                    }
                }

                let handle = app_handle.clone();
                let data = url.clone();
                tauri::async_runtime::spawn(async {
                    if let Err(err) = validate_code(handle, data).await {
                        log::error!("{}", err);
                    }
                });
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::authenticate,
            commands::logout
        ])
        .build()
}
