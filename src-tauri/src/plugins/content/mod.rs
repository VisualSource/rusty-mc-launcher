mod commands;
use std::{sync::Mutex, time::Duration};

use minecraft_launcher_lib::events::DownloadEvent;
use tauri::{
    async_runtime::JoinHandle,
    ipc::Channel,
    plugin::{Builder, TauriPlugin},
    Emitter, EventTarget, Manager, RunEvent, Runtime,
};

use crate::error::Error;

#[derive(Clone)]
pub struct EventChannel(Option<Channel<DownloadEvent>>);

impl EventChannel {
    fn new() -> Self {
        Self(None)
    }
    fn send(&self, data: DownloadEvent) -> Result<(), Error> {
        if let Some(channel) = self.0.as_ref() {
            return channel.send(data).map_err(Error::Tauri);
        }

        Err(Error::NoChannel)
    }
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-content")
        .setup(|app, _api| {
            app.manage(Mutex::new(EventChannel::new()));

            /*let app_handle = app.app_handle().clone();
            // downloads watcher
            let downloads_handle = tauri::async_runtime::spawn(async move {
                // check database
                loop {
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
                }

                Ok::<(), Error>(())
            });

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

            app.manage([downloads_handle, process_watcher_handle]);*/

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
            commands::downloads_listener
        ])
        .build()
}
