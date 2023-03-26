use crate::errors::Error;
use crate::state::TauriState;
use log::{debug, error};
use minecraft_launcher_lib::installer::Installer;
use minecraft_launcher_lib::observer::{Observer, Subject};
use minecraft_launcher_lib::ClientBuilder;
use std::path::PathBuf;
use tauri::Window;
use tauri_plugin_oauth::{start_with_config, OauthConfig};

#[tauri::command]
pub async fn start_server(window: Window, port: u16, origin: String) -> Result<u16, Error> {
    let config = OauthConfig {
        ports: Some(vec![port]),
        response: None,
    };

    let path = format!("http://localhost:{}/", port);

    start_with_config(config, move |url| {
        if url.starts_with(&path) {
            let _ = window.emit(
                "redirect_uri",
                format!(
                    r#"{{ "status":"ok", "data": "{}" }}"#,
                    url.replace(&path, "")
                ),
            );
            return;
        }

        let _ = window.emit("redirect_uri", r#"{"status":"error","data":""}"#);
    })
    .map_err(|err| Error::Auth(err.to_string()))
}

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
