use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|app, api| {
            // TODO: load process cache
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::select,
            commands::execute,
        ])
        .build()
}
