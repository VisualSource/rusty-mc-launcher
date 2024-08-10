mod commands;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|_app, _api| {
            log::debug!("Setup <rmcl-game> plugin");
            // TODO: load process cache
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::launch_game,
            commands::is_running,
            commands::stop
        ])
        .build()
}
