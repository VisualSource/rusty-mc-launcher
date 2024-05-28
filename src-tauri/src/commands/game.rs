use crate::errors::Error;
use minecraft_launcher_lib::{start_game, AppState, LaunchConfig};

#[tauri::command]
pub async fn launch_game(
    state: tauri::State<'_, AppState>,
    config: LaunchConfig,
) -> Result<(), Error> {
    start_game(&state, config).await?;
    Ok(())
}

#[tauri::command]
pub async fn is_running(state: tauri::State<'_, AppState>, profile: String) -> Result<bool, Error> {
    Ok(state
        .instances
        .running_profiles_ids()
        .await?
        .contains(&profile))
}

#[tauri::command]
pub async fn stop(state: tauri::State<'_, AppState>, profile: String) -> Result<(), Error> {
    let instances = state.instances.running_keys_with_profile(&profile).await?;

    for instance in instances {
        state.instances.stop_process(&state, instance).await?;
    }

    Ok(())
}
