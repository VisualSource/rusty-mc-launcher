mod commands;
mod desktop;
use minecraft_launcher_lib::events::DownloadEvent;
use std::time::Duration;
use tauri::{
    Manager, RunEvent, Runtime,
    ipc::Channel,
    plugin::{Builder, TauriPlugin},
};
use tokio::{select, sync::Mutex};
use tokio_util::sync::CancellationToken;

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
                            desktop::install(&app_handle).await;
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
            if let RunEvent::ExitRequested { .. } = event {
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
