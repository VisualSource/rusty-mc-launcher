use crate::errors::Error;
use crate::state::TauriState;
use log::{debug, error};
use minecraft_launcher_lib::installer::Installer;
use minecraft_launcher_lib::observer::{Observer, Subject};
use minecraft_launcher_lib::ClientBuilder;
use std::path::PathBuf;
use tauri::Window;
#[derive(PartialEq)]
struct DownloadObserver {
    id: i32,
    window: tauri::Window,
}
impl Observer for DownloadObserver {
    fn update(&self, event: String, msg: String) {
        if let Err(err) = self.window.emit(event.as_str(), msg) {
            error!("Failed to notify window: {}", err);
        }
    }
}

#[tauri::command]
pub async fn check_install(version: String, game_dir: Option<PathBuf>) -> Result<bool, Error> {
    Ok(ClientBuilder::check_install(version, game_dir).await?)
}

#[tauri::command]
pub async fn install(
    version: String,
    game_dir: Option<PathBuf>,
    window: tauri::Window,
) -> Result<(), Error> {
    debug!("Install {} to {:#?}", version, game_dir);
    let obs = DownloadObserver { id: 1, window };
    let mut installer = Installer::<DownloadObserver>::new(version, game_dir);
    installer.attach(&obs);
    installer.install().await?;
    Ok(())
}

#[tauri::command]
pub async fn stop(state: tauri::State<'_, TauriState>) -> Result<(), Error> {
    let mut nt = state.0.lock().await;
    nt.stop().await?;
    Ok(())
}

#[tauri::command]
pub async fn play(
    settings: ClientBuilder,
    _window: Window,
    state: tauri::State<'_, TauriState>,
) -> Result<(), Error> {
    let client = settings.build().await?;
    let running_client = client.run().await?;
    let mut nt = state.0.lock().await;
    *nt = running_client;
    Ok(())
}
