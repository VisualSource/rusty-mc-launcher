use crate::errors::Error;
use crate::state::TauriState;
use log::{debug, error, info};
use minecraft_launcher_lib::installer::Installer;
use minecraft_launcher_lib::{ChannelMessage, ClientBuilder};
use std::path::PathBuf;
use tauri::Window;
use tauri_plugin_oauth::{start_with_config, OauthConfig};

#[tauri::command]
pub async fn start_server(window: Window, port: u16, _origin: String) -> Result<u16, Error> {
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

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(32);
    let txm = tx.clone();

    let manager = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            info!("{}: {}", &msg.event, &msg.value);
            if let Err(err) = window.emit(format!("mcl::i::{}", &msg.event).as_str(), &msg.value) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = Installer::new(version, game_dir, tx);
    let result = handler.install().await;

    if let Err(err) = txm.send(ChannelMessage::new("complete", "ok")).await {
        error!("{}", err);
    }

    manager.abort();

    result.map_err(|err| Error::from(err))
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
