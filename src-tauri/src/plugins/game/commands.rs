use super::desktop::{PluginGameState, ProcessStatePayload};
use super::PROCESSES_STATE_EVENT;
use minecraft_launcher_lib::launcher::{start_game, LaunchConfig};
use tauri::{Emitter, Runtime};
use tokio::sync::RwLock;

use crate::error::Error;

#[tauri::command]
pub async fn launch_game<R: Runtime>(
    app: tauri::AppHandle<R>,
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    ps: tauri::State<'_, PluginGameState>,
    config: LaunchConfig,
) -> Result<(), Error> {
    let dbr = db.write().await;

    if let Err(err) = app.emit(
        PROCESSES_STATE_EVENT,
        ProcessStatePayload::Starting(config.get_profile()),
    ) {
        log::error!("{}", err);
    }

    start_game(&dbr, &ps.0, config).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn is_running(ps: tauri::State<'_, PluginGameState>, id: String) -> Result<bool, Error> {
    let mut state = ps.0.write().await;
    state.is_running(&id).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn stop(ps: tauri::State<'_, PluginGameState>, id: String) -> Result<(), Error> {
    let mut state = ps.0.write().await;

    if let Some(process) = state.get_mut(&id) {
        process.kill().await?;
    }

    Ok(())
}
