use crate::errors::Error;
use crate::oauth::{cancel, start};
use log::{debug, error};
use tauri::Window;

#[tauri::command]
pub async fn start_auth_server(window: Window) -> Result<u16, Error> {
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

#[tauri::command]
pub fn close_auth_server(port: u16) -> Result<(), Error> {
    debug!("Closing auth server on port: {port}");
    cancel(port).map_err(Error::from)
}
