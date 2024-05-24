use std::path::PathBuf;

use crate::errors::Error;
use log::{debug, error};
use minecraft_launcher_lib::{
    installer::content::install_mrpack, start_game, AppState, ChannelMessage, LaunchConfig,
};
use tokio::sync::mpsc;

macro_rules! message_bridge {
    ($window: expr) => {{
        let (tx, mut rx) = mpsc::channel::<ChannelMessage>(32);
        let handler = tokio::spawn(async move {
            while let Some(msg) = rx.recv().await {
                debug!("{:#?}", msg);
                if msg.event == "complete" {
                    rx.close();
                }
                if let Err(err) = $window.emit("rmcl:://download", msg) {
                    error!("Failed to notify window: {}", err);
                }
            }
        });

        (handler, tx)
    }};
}

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

// remember to call `.manage(MyState::default())`
#[tauri::command]
pub async fn install_local_mrpack(
    window: tauri::Window,
    state: tauri::State<'_, AppState>,
    file_path: PathBuf,
) -> Result<(), Error> {
    let (handler, tx) = message_bridge!(window);

    let result = install_mrpack(&state, tx, &file_path).await;
    if let Err(err) = handler.await {
        error!("Failed to exit event manager: {}", err);
    };

    result.map_err(Error::from)
}
