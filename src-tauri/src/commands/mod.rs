use crate::errors::Error;
use crate::state::TauriState;
use log::{debug, error};
use minecraft_launcher_lib::installer::Installer;
use minecraft_launcher_lib::{
    install_mod_list, packs, ChannelMessage, ClientBuilder, FileDownload,
};
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
        debug!("{}", url);
        if url.starts_with(&path) {
            debug!("Start with port");
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

    let manager = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            debug!("{:#?}", msg);
            if msg.event == "complete" {
                rx.close();
            }
            if let Err(err) = window.emit("mcl::download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = Installer::new(version, game_dir, tx);
    let result = handler.install().await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    result.map_err(|err| Error::from(err))
}

#[tauri::command]
pub async fn install_mods(
    id: String,
    files: Vec<FileDownload>,
    game_dir: Option<PathBuf>,
    window: tauri::Window,
) -> Result<(), Error> {
    debug!("Install profile mods folder {} to {:#?}", id, game_dir);

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(32);

    let manager = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            debug!("{:#?}", msg);
            if msg.event == "complete" {
                rx.close();
            }
            if let Err(err) = window.emit("mcl::download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = install_mod_list(id, files, game_dir, tx).await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    handler.map_err(|err| Error::from(err))
}

#[tauri::command]
pub async fn install_pack(
    file: FileDownload,
    pack_type: packs::PackType,
    game_dir: Option<PathBuf>,
    window: Window,
) -> Result<(), Error> {
    debug!(
        "Installing shader/resource pack, {:#?} type {:#?}",
        file, pack_type
    );
    let (tx, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(32);

    let manager = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            debug!("{:#?}", msg);
            if msg.event == "complete" {
                rx.close();
            }
            if let Err(err) = window.emit("mcl::download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = packs::install_pack(file, pack_type, game_dir, tx).await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    handler.map_err(|err| Error::from(err))
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
