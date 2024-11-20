mod commands;
mod desktop;

use std::time::Duration;

use desktop::{PluginGameState, ProcessStatePayload};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Emitter, EventTarget, Manager, RunEvent, Runtime,
};
use tokio_util::sync::CancellationToken;

use minecraft_launcher_lib::{database::Database, process::Processes};
use tokio::{select, sync::RwLock};

use crate::error::Error;

const PROCESS_CRASH_EVENT: &str = "";
pub const PROCESSES_STATE_EVENT: &str = "";

struct PluginGameCancellationToken(CancellationToken);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|app, _api| {
            // rescue processes from cahce
            let processes = tauri::async_runtime::block_on(async {
                let mut data = Processes::default();

                let state = app.state::<RwLock<Database>>();
                let db = state.write().await;

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
                            let state = handle.state::<PluginGameState>();
                            let removable = {
                                let mut ps_list = state.0.write().await;

                                let mut removable = Vec::new();
                                for (uuid, ps) in &mut ps_list.state {
                                    let status = ps
                                        .status()
                                        .await
                                        .map(|status| status.unwrap_or(-1))
                                        .unwrap_or_default();

                                    match status {
                                        // no exit code
                                        e if e < 0 => continue,
                                        // error exit code
                                        e if e > 0 => {
                                            if let Err(err) = handle.emit_to(
                                               "main",
                                                PROCESS_CRASH_EVENT,
                                                uuid,
                                            ) {
                                                log::error!("{}", err);
                                            }
                                            removable.push(uuid.clone());
                                        }
                                        // 0 exit code
                                        _ => {
                                            removable.push(uuid.clone());
                                        }
                                    }
                                }
                                removable
                            };
                            // drop ald processes
                            if !removable.is_empty() {
                                let s_db =
                                    handle.state::<RwLock<minecraft_launcher_lib::database::Database>>();

                                let mut state = state.0.write().await;
                                let db = s_db.write().await;
                                if let Err(err) = state.remove_from_cache(&db, &removable).await {
                                    log::error!("{}", err);
                                }

                                if let Err(err) = handle.emit_to(
                                    EventTarget::labeled("main"),
                                    PROCESSES_STATE_EVENT,
                                    ProcessStatePayload::Remove(removable),
                                ) {
                                    log::error!("{}", err);
                                }
                            }
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
            if let RunEvent::Exit = &ev {
                let state = app.state::<PluginGameCancellationToken>();
                state.0.cancel();
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::launch_game,
            commands::is_running,
            commands::stop
        ])
        .build()
}
