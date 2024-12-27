use super::desktop::{cancel, start};
use crate::error::Result;
use log::{debug, error};
use tauri::{Emitter, WebviewWindow};

#[tauri::command]
pub fn start_auth_server<R: tauri::Runtime>(window: WebviewWindow<R>) -> Result<u16> {
    let port = start(move |url| {
        log::debug!("found result");
        if let Err(err) = window.emit("auth-response", url) {
            error!("{}", err);
        }
    })?;
    debug!("Starting Auth Server on port: {}", port);
    Ok(port)
}

#[tauri::command]
pub fn close_auth_server(port: u16) -> Result<()> {
    debug!("Closing auth server on port: {port}");
    cancel(port)
}
