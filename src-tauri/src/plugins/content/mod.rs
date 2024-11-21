mod commands;
mod desktop;
use std::time::Duration;
use tokio_util::sync::CancellationToken;
use minecraft_launcher_lib::{
    database::Database,
    events::DownloadEvent,
    models::{
        profile::{Profile, ProfileState},
        queue::{QueueItem, QueueState, QueueType},
    },
};
use tauri::{
    ipc::Channel,
    plugin::{Builder, TauriPlugin},
    Emitter, EventTarget, Manager, RunEvent, Runtime,
};
use tokio::{select, sync::Mutex};
use tokio::sync::RwLock;

use crate::error::Error;

struct PluginContentCancellationToken(CancellationToken);

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-content")
        .setup(|app, _api| {
            app.manage(Mutex::new(Option::<Channel<DownloadEvent>>::None));

            let app_handle = app.app_handle().clone();
            let token = CancellationToken::new();
            let kill_token = token.clone();
            // downloads watcher
            tauri::async_runtime::spawn(async move {
                loop {
                    select! {
                        _ = kill_token.cancelled() => {
                            break;
                        }
                        _ = tokio::time::sleep(Duration::from_secs(5)) => {
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
                                                // handler error
                                                let db = state.write().await;
                                                log::error!("{}", err);
                                                if let Err(err) = QueueItem::set_state(&item.id, QueueState::Errored, &db).await
                                                {
                                                    log::error!("{}", err);
                                                }
                                            }
                                        }
                                        QueueType::Modpack
                                        | QueueType::Mod
                                        | QueueType::Shader
                                        | QueueType::Resourcepack => {
                                            if let Err(err) = desktop::install_content(&item, &state, emitter).await {
                                                let db = state.write().await;
                                                log::error!("{}", err);
                                                if let Err(err) = QueueItem::set_state(&item.id, QueueState::Errored, &db).await
                                                {
                                                    log::error!("{}", err);
                                                }
                                            }
                                        },
                                        QueueType::Datapack => {
                                            let db = state.write().await;
                                            log::error!("Datapack install has no support for installing yet");
                                            if let Err(err) =
                                                QueueItem::set_state(&item.id, QueueState::Errored, &db)
                                                    .await
                                            {
                                                log::error!("{}", err);
                                            }
                                        }
                                        QueueType::CurseforgeModpack => {
                                            if let Err(err) = desktop::install_external(&item, &state, emitter).await {
                                                let db = state.write().await;
                                                log::error!("{}", err);
                                                if let Err(err) = QueueItem::set_state(&item.id, QueueState::Errored, &db).await
                                                {
                                                    log::error!("{}", err);
                                                }
                                            }
                                        },
                                    }
                                }
                                Ok(None) => {}
                                Err(err) => {
                                    log::error!("{}", err);
                                }
                            }
                        }
                    }
                }
                Ok::<(), Error>(())
            });

            app.manage(PluginContentCancellationToken(token));

            log::debug!("Plugin <rmcl-content> Ready");
            Ok(())
        })
        .on_event(|app, event| {
            if let RunEvent::Exit = event {
                let handle = app.state::<PluginContentCancellationToken>();
                handle.0.cancel();
                log::debug!("Aborting content queue")
            }
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
