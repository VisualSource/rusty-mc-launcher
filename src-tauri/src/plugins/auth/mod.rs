mod commands;
mod desktop;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-auth")
        .setup(|_app, _api| {
            log::debug!("Setup <rmcl-auth> plugin");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::start_auth_server,
            commands::close_auth_server
        ])
        .build()
}
