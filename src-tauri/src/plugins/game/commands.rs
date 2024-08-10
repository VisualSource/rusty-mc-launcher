use minecraft_launcher_lib::{AppState, LaunchConfig};

#[tauri::command]
pub async fn launch_game(
    state: tauri::State<'_, AppState>,
    config: LaunchConfig,
) -> Result<(), String> {
    todo!("Start instance")
}

#[tauri::command]
pub async fn is_running(
    state: tauri::State<'_, AppState>,
    profile: String,
) -> Result<bool, String> {
    todo!("is instance running")
}

#[tauri::command]
pub async fn stop(state: tauri::State<'_, AppState>, profile: String) -> Result<(), String> {
    todo!("Stop a instance")
}
