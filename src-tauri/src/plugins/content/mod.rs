mod commands;
mod desktop;
use std::time::Duration;

use minecraft_launcher_lib::{
    database::Database,
    events::DownloadEvent,
    models::{
        profile::{Profile, ProfileState},
        queue::{QueueItem, QueueState, QueueType},
    },
};
use tauri::{
    async_runtime::JoinHandle,
    ipc::Channel,
    plugin::{Builder, TauriPlugin},
    Emitter, EventTarget, Manager, RunEvent, Runtime,
};
use tokio::sync::Mutex;
use tokio::sync::RwLock;

use crate::error::Error;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-content")
        .setup(|app, _api| {
            app.manage(Mutex::new(Option::<Channel<DownloadEvent>>::None));

            let app_handle = app.app_handle().clone();
            // downloads watcher
            let downloads_handle = tauri::async_runtime::spawn(async move {
                loop {
                    // slow iters
                    tokio::time::sleep(Duration::from_secs(5)).await;

                    let state = app_handle.state::<RwLock<Database>>();
                    let emitter_state = app_handle.state::<Mutex<Option<Channel<DownloadEvent>>>>();

                    let item = {
                        let db = state.read().await;
                        QueueItem::get_pending(&db).await
                    };
                    match item {
                        Ok(Some(item)) => {
                            log::debug!("Processing Item: {}", item.id);
                            let emitter_c = emitter_state.lock().await;
                            if emitter_c.is_none() {
                                continue;
                            }
                            let emitter = emitter_c.as_ref().unwrap();
                            match item.content_type {
                                QueueType::Client => {
                                    if let Err(err) =
                                        desktop::install_client(&item, &state, emitter).await
                                    {
                                        log::error!("{}", err);
                                        // handler error
                                    } else {
                                        // clean up
                                    }
                                }
                                QueueType::Modpack
                                | QueueType::Mod
                                | QueueType::Shader
                                | QueueType::Resourcepack => todo!(),
                                QueueType::Datapack => {
                                    let db = state.write().await;
                                    log::error!("Datapack install has no implemtion");
                                    if let Err(err) =
                                        QueueItem::set_state(&item.id, QueueState::Errored, &db)
                                            .await
                                    {
                                        log::error!("{}", err);
                                    }
                                }
                                QueueType::CurseforgeModpack => todo!(),
                            }
                        }
                        Ok(None) => {}
                        Err(err) => {
                            log::error!("{}", err);
                        }
                    }
                }

                /* loop {
                    tokio::time::sleep(Duration::from_secs(5)).await;
                    // if pending install
                    let emitter = app_handle.state::<Mutex<EventChannel>>();
                    let emitter_lock = emitter.lock();
                    match emitter_lock {
                        Ok(emitter) => {
                            if emitter.0.is_none() {
                                continue;
                            }

                            if let Err(err) = emitter.send(DownloadEvent::Progress { amount: 10 }) {
                                log::error!("{}", err);
                            }
                        }
                        Err(err) => {
                            log::error!("{}", err)
                        }
                    }
                }*/

                Ok::<(), Error>(())
            });

            app.manage([downloads_handle]);

            log::debug!("Plugin <rmcl-content> Ready");
            Ok(())
        })
        .on_event(|_app, _event| {
            // log::debug!("Abort tasks");
            /*if let RunEvent::Exit = event {
                let handles = app.state::<[JoinHandle<crate::error::Result<()>>; 2]>();
                handles[0].abort();
                handles[1].abort();
            }*/
        })
        .invoke_handler(tauri::generate_handler![
            commands::delete_profile,
            commands::create_profile,
            commands::copy_profile,
            commands::uninstall_content,
            commands::import_external,
            commands::downloads_listener,
            commands::get_system_ram,
        ])
        .build()
}
