mod commands;

use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

use minecraft_launcher_lib::{database::Database, process::Processes};
use tokio::sync::RwLock;

use crate::error::Error;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|app, _api| {
            let processes = tauri::async_runtime::block_on(async {
                let mut data = Processes::new();

                let state = app.state::<RwLock<Database>>();
                let db = state.write().await;

                data.load_cache(&db).await.map_err(Error::Lib)?;

                Ok::<Processes, Error>(data)
            })?;

            app.manage(RwLock::new(processes));

            // startup process watcher

            log::debug!("Setup <rmcl-game> plugin");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::launch_game,
            commands::is_running,
            commands::stop
        ])
        .build()
}
