use super::PROCESSES_STATE_EVENT;
use super::desktop::{PluginGameState, ProcessStatePayload};
use minecraft_launcher_lib::database::RwDatabase;
use minecraft_launcher_lib::launcher::{LaunchConfig, start_game};
use tauri::{Emitter, Runtime};

use crate::error::Error;
use crate::plugins::game::desktop::{PROCESS_CRASH_EVENT, ProcessCrashEvent};

#[tauri::command]
pub async fn launch_game<R: Runtime>(
    app: tauri::AppHandle<R>,
    db: tauri::State<'_, RwDatabase>,
    ps: tauri::State<'_, PluginGameState>,
    config: LaunchConfig,
) -> Result<(), Error> {
    let profile_id = config.get_profile();

    log::debug!("Starting processes: Profile UUID: {}", profile_id);

    let (tx, rx) = tokio::sync::oneshot::channel::<String>();

    if let Err(err) = start_game(&db, &ps.0, config, tx).await.map_err(Error::Lib) {
        log::error!("{}", err);
        return Err(err);
    }

    if let Err(err) = app.emit(
        PROCESSES_STATE_EVENT,
        ProcessStatePayload::Add(profile_id.clone()),
    ) {
        log::error!("{}", err);
    }

    match rx.await {
        Ok(result) => {
            if result.as_str() == "process::exited" {
                return Err(Error::Reason("Process was stopped".to_string()));
            }

            if result.as_str() == "error::timeout" {
                if let Err(err) = app.emit(
                    PROCESS_CRASH_EVENT,
                    ProcessCrashEvent::new(profile_id, "Launch timeout".to_string(), 1),
                ) {
                    log::error!("{}", err);
                }

                return Err(Error::Reason("Game luanch timed out!".to_string()));
            }
        }
        Err(err) => {
            log::error!("{}", err)
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn stop(ps: tauri::State<'_, PluginGameState>, id: String) -> Result<(), Error> {
    let mut state = ps.0.write().await;

    if let Some(process) = state.get_mut(&id) {
        process.kill().await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn list_active_processes(
    ps: tauri::State<'_, PluginGameState>,
) -> Result<ProcessStatePayload, Error> {
    let ps = ps.0.read().await;

    let data = ps.get_running();

    Ok(ProcessStatePayload::List(data.clone()))
}
