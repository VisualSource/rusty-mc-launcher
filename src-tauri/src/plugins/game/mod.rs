mod commands;
mod desktop;

use std::time::Duration;

use desktop::{process_watcher, PluginGameState, PROCESSES_STATE_EVENT};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, RunEvent, Runtime,
};
use tokio_util::sync::CancellationToken;

use minecraft_launcher_lib::{database::RwDatabase, process::Processes};
use tokio::select;

use crate::error::Error;

struct PluginGameCancellationToken(CancellationToken);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|app, _api| {
            // rescue processes from cache
            let processes = tauri::async_runtime::block_on(async {
                let mut data = Processes::default();

                let db = app.state::<RwDatabase>();
                data.load_cache(&db).await.map_err(Error::Lib)?;

                Ok::<Processes, Error>(data)
            })?;

            app.manage(PluginGameState::new(processes));

            //
            //  1. On game start as process entry is added to the db.
            // 2. scan process state
            // 3. emit events for first seen processes
            // 3. emit events for crashed processes
            //

            let handle = app.app_handle().clone();
            let token = CancellationToken::new();

            let kill_token = token.clone();
            tauri::async_runtime::spawn(async move {
                loop {
                    select! {
                        _ = kill_token.cancelled() => {
                            break;
                        }
                        _ = tokio::time::sleep(Duration::from_secs(4)) => {
                           process_watcher(&handle).await;
                        }
                    }
                }
                Ok::<(), Error>(())
            });

            app.manage(PluginGameCancellationToken(token));

            log::debug!("Setup <rmcl-game> plugin");
            Ok(())
        })
        .on_event(|app, ev| {
            if let RunEvent::ExitRequested { .. } = &ev {
                let state = app.state::<PluginGameCancellationToken>();
                state.0.cancel();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::launch_game,
            commands::is_running,
            commands::stop,
            commands::list_active_processes
        ])
        .build()
}
