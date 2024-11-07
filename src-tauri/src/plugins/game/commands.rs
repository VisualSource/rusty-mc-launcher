use minecraft_launcher_lib::{
    launcher::{start_game, LaunchConfig},
    process::Processes,
};
use tokio::sync::RwLock;

use crate::error::Error;

#[tauri::command]
pub async fn launch_game(
    db: tauri::State<'_, RwLock<minecraft_launcher_lib::database::Database>>,
    ps: tauri::State<'_, RwLock<Processes>>,
    config: LaunchConfig,
) -> Result<(), Error> {
    let dbr = db.write().await;
    start_game(&dbr, &ps, config).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn is_running(
    ps: tauri::State<'_, RwLock<Processes>>,
    id: String,
) -> Result<bool, Error> {
    let mut state = ps.write().await;
    state.is_running(&id).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn stop(ps: tauri::State<'_, RwLock<Processes>>, id: String) -> Result<(), Error> {
    let mut state = ps.write().await;

    if let Some(process) = state.get_mut(&id) {
        process.kill().await?;
    }

    Ok(())
}
