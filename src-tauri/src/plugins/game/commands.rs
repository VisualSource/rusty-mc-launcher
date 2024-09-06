use minecraft_launcher_lib::{launcher::LaunchConfig, process::Processes};
use tokio::sync::RwLock;

use crate::error::Error;

#[tauri::command]
pub async fn launch_game(
    ps: tauri::State<'_, RwLock<Processes>>,
    config: LaunchConfig,
) -> Result<(), String> {
    todo!("Start instance")
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
