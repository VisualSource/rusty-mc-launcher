use crate::errors::Error;
use crate::state::TauriState;
use log::{debug, error};
use minecraft_launcher_lib::installer::Installer;
use minecraft_launcher_lib::{
    client::ClientBuilder, client::GameProcessStatus, install_mod_list, packs, ChannelMessage,
    FileDownload,
};

use crate::oauth::start;
use std::path::PathBuf;
use tauri::Window;

#[tauri::command]
pub async fn start_auth_server(window: Window) -> Result<u16, Error> {
    debug!("Starting Auth server");
    let port = start(move |url| {
        if let Err(err) = window.emit(
            "rmcl://auth_response",
            format!(r#"{{ "status":"ok", "data": "{}" }}"#, url),
        ) {
            error!("{}", err);
        }
    })?;
    debug!("Starting Auth Server on port: {}", port);
    Ok(port)
}

// Game Function commands

#[tauri::command]
pub async fn play(
    settings: ClientBuilder,
    state: tauri::State<'_, TauriState>,
) -> Result<(), Error> {
    let client = settings.build().await?;
    let running_client = client.run().await?;
    let mut nt = state.0.lock().await;
    *nt = running_client;
    Ok(())
}

#[tauri::command]
pub async fn stop(state: tauri::State<'_, TauriState>) -> Result<(), Error> {
    let mut nt = state.0.lock().await;
    nt.stop().await?;
    Ok(())
}

#[tauri::command]
pub async fn is_game_running(
    state: tauri::State<'_, TauriState>,
) -> Result<GameProcessStatus, Error> {
    let mut nt = state.0.lock().await;

    let status = nt.is_running()?;

    Ok(status)
}

#[tauri::command]
pub async fn get_minecraft_dir() -> Result<String, Error> {
    let dir = ClientBuilder::get_minecraft_dir()?;

    Ok(dir.to_string_lossy().to_string())
}

// validate
#[tauri::command]
pub async fn validate_game_files(
    version: String,
    game_dir: Option<PathBuf>,
) -> Result<bool, Error> {
    Ok(ClientBuilder::check_install(version, game_dir).await?)
}
#[tauri::command]
pub async fn validate_mods_files(
    profile_id: String,
    files: Vec<FileDownload>,
    game_dir: Option<PathBuf>,
    window: tauri::Window,
) -> Result<bool, Error> {
    debug!("Starting mods validation");
    let dir = ClientBuilder::get_minecraft_dir()?;
    let mod_dir = game_dir.unwrap_or(dir).join(".mcl").join(profile_id);

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(32);

    let manager = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            debug!("{:#?}", msg);
            if msg.event == "end" {
                rx.close();
            }
            if let Err(err) = window.emit("rmcl:://download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    minecraft_launcher_lib::validate_mods(mod_dir, files, tx).await?;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    Ok(true)
}
#[tauri::command]
pub async fn validate_pack_files() -> Result<bool, Error> {
    Ok(true)
}
#[tauri::command]
pub async fn validate_modpack_files() -> Result<bool, Error> {
    Ok(true)
}

// install

#[tauri::command]
pub async fn install_game(
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
            if let Err(err) = window.emit("rmcl:://download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = Installer::new(version, game_dir, tx);
    let result = handler.install().await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    result.map_err(Error::from)
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
            if let Err(err) = window.emit("rmcl:://download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = install_mod_list(id, files, game_dir, tx).await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    handler.map_err(Error::from)
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
            if let Err(err) = window.emit("rmcl:://download", msg) {
                error!("Failed to notify window: {}", err);
            }
        }
    });

    let handler = packs::install_pack(file, pack_type, game_dir, tx).await;

    if let Err(err) = manager.await {
        error!("Failed to exit event manager: {}", err);
    };

    handler.map_err(Error::from)
}

#[tauri::command]
pub async fn install_modpack(_window: Window) -> Result<(), Error> {
    Ok(())
}
