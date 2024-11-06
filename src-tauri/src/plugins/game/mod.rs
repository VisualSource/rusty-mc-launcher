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
                let mut data = Processes::default();

                let state = app.state::<RwLock<Database>>();
                let db = state.write().await;

                data.load_cache(&db).await.map_err(Error::Lib)?;

                Ok::<Processes, Error>(data)
            })?;

            /*
            let watch_app_handle = app.app_handle().clone();
            let process_watcher_handle = tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_secs(5)).await;
                    // fetch state
                    // look for exited processes
                    // emit events for crashed processes
                    if let Err(err) =
                        watch_app_handle.emit_to(EventTarget::labeled("main"), "process_crashed", 1)
                    {
                        log::error!("{}", err);
                    }
                }

                Ok::<(), Error>(())
            });

             */

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
