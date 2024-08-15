use minecraft_launcher_lib::{process::Processes, AppState, LaunchConfig};
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
    let state = ps.read().await;

    state.is_running(&id).await
}

#[tauri::command]
pub async fn stop(ps: tauri::State<'_, RwLock<Processes>>, id: String) -> Result<(), Error> {
    let state = ps.write().await;

    if let Some(process) = state.get_mut(&id) {
        process.kill().await?;
    }

    Ok(())
}

#[tauri::command]
pub async fn get_system_ram() -> u64 {
    minecraft_launcher_lib::get_ram()
}
