mod commands;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-content")
        .setup(|_app, _api| {
            log::debug!("Setup <rmcl-content> plugin");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::delete_profile,
            commands::create_profile,
            commands::copy_profile,
            commands::uninstall_content,
            commands::import_external,
            commands::get_system_ram
        ])
        .build()
}
