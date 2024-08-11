//use crate::oauth::{cancel, start};

use super::desktop::cancel;
use log::{debug, error};
use tauri::{command, Emitter, Window};

#[command]
pub fn start_auth_server(/*window: Window*/) -> Result<u16, String> {
    /*let port = start(move |url| {
        if let Err(err) = window.emit(
            "rmcl://auth_response",
            format!(r#"{{ "status":"ok", "data": "{}" }}"#, url),
        ) {
            error!("{}", err);
        }
    })
    .map_err(|err| err.to_string())?;
    debug!("Starting Auth Server on port: {}", port);
    Ok(port)*/
    Ok(5000)
}

#[command]
pub fn close_auth_server(port: u16) -> Result<(), String> {
    debug!("Closing auth server on port: {port}");
    cancel(port).map_err(|err| err.to_string())
}
