mod commands;
mod desktop;

use std::time::Duration;

use desktop::{
    PluginGameState, ProcessCrashEvent, ProcessStatePayload, PROCESSES_STATE_EVENT,
    PROCESS_CRASH_EVENT,
};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Emitter, Manager, RunEvent, Runtime,
};
use tokio_util::sync::CancellationToken;

use minecraft_launcher_lib::{
    database::Database,
    process::{InstanceType, Processes},
};
use tokio::{io::AsyncReadExt, select, sync::RwLock};

use crate::error::Error;

struct PluginGameCancellationToken(CancellationToken);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-game")
        .setup(|app, _api| {
            // rescue processes from cache
            let processes = tauri::async_runtime::block_on(async {
                let mut data = Processes::default();

                let state = app.state::<RwLock<Database>>();
                let db = state.write().await;

                let active = data.load_cache(&db).await.map_err(Error::Lib)?;

                if let Err(err) = app.emit(PROCESSES_STATE_EVENT, ProcessStatePayload::Init(active)) {
                    log::error!("{}",err);
                }

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
                                    let profile_id = ps.profile_id.clone();

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
                                            if let InstanceType::Full(child) = &mut ps.child {
                                                if let Some(mut output) = child.stderr.take() {
                                                    let mut io = String::new();
                                                    if let Err(err) = output.read_to_string(&mut io).await {
                                                        log::error!("{}",err);
                                                    };
                                                    log::debug!("{:#?}",io);
                                                }
                                            }

                                            if let Err(err) = handle.emit(
                                                PROCESS_CRASH_EVENT,
                                                ProcessCrashEvent::new(profile_id.clone(),e),
                                            ) {
                                                log::error!("{}", err);
                                            }
                                            log::debug!("Process crashed: {}",uuid);
                                            removable.push((uuid.clone(),profile_id));
                                        }
                                        // 0 exit code
                                        _ => {
                                            log::debug!("Process exited: {}",uuid);
                                            removable.push((uuid.clone(),profile_id));
                                        }
                                    }
                                }
                                removable
                            };
                            // drop old processes
                            if !removable.is_empty() {
                                let s_db =
                                    handle.state::<RwLock<minecraft_launcher_lib::database::Database>>();

                                log::debug!("Removing old processes: {:?}",removable);

                                let (process_ids,profile_ids) = removable.into_iter().unzip();

                                let mut state = state.0.write().await;
                                let db = s_db.write().await;
                                if let Err(err) = state.remove_from_cache(&db, &process_ids).await {
                                    log::error!("{}", err);
                                }

                                if let Err(err) = handle.emit(
                                    PROCESSES_STATE_EVENT,
                                    ProcessStatePayload::Remove(profile_ids),
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
            if let RunEvent::ExitRequested { .. } = &ev {
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
