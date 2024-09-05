use super::desktop::{cancel, start};
use crate::error::Result;
use log::{debug, error};

#[tauri::command]
pub fn start_auth_server(app: tauri::AppHandle) -> Result<u16> {
    /*
      let port = start(move |url| {
        if let Err(err) = app.emit("rmcl://auth_response", url) {
            error!("{}", err);
        }
    })?;
     */
    //debug!("Starting Auth Server on port: {}", port);
    Ok(2000)
}

#[tauri::command]
pub fn close_auth_server(port: u16) -> Result<()> {
    debug!("Closing auth server on port: {port}");
    cancel(port)
}
