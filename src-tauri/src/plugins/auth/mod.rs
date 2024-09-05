mod commands;
mod desktop;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Listener, Manager, Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-auth")
        .setup(|app, _api| {
            log::debug!("Setup <rmcl-auth> plugin");

            app.listen("rmcl://ms/authroize", |url| {
                log::debug!("Event {:?}", url);
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_auth_server,
            commands::close_auth_server
        ])
        .build()
}
