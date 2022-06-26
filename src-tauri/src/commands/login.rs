use std::path::PathBuf;
use mc_laucher_lib_rs::login;
use tauri::{WindowBuilder, Manager};
use std::env;
use tauri::{Runtime, WindowUrl};
use log::error;
use crate::consts::REDIRECT_URI;


#[tauri::command]
pub async fn token_refresh(token: String) -> Result<mc_laucher_lib_rs::json::authentication_microsoft::Account, String> {
   match login::login_microsoft_refresh(String::from(env!("CLIENT_ID")), REDIRECT_URI.into(), token).await {
       Ok(value) => Ok(value),
       Err(err) => Err(err.to_string())
   }
}

#[tauri::command]
pub async fn login_done<R: Runtime>(window: tauri::Window<R>, code: String) -> Result<(), String> {
    if window.label() != "ms-login" { return Ok(()); }

    match login::login_microsoft(String::from(env!("CLIENT_ID")), REDIRECT_URI.into(), code).await {
        Ok(value) => {
            if let Err(err) = window.emit_to("main", "login_done", value) {
                error!("{}",err);
            }
        }
        Err(err) => {
            error!("{}",err);
        }
    }

    if let Err(err) = window.close() {
        error!("{}",err);
    }

    Ok(())
}

#[tauri::command]
pub async fn logout_done<R: Runtime>(window: tauri::Window<R>) -> Result<(), String> {
    if window.label() == "ms-logout" {
        if let Err(err) = window.close() {
            error!("{}",err);
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn auth_error<R: Runtime>(window: tauri::Window<R>, msg: String) -> Result<(), String> {
    if window.label() == "ms-login" || window.label() == "ms-logout" {
        error!("{}",msg);
        if let Err(err) = window.emit_to("main", "auth_error", msg) {
           error!("{}",err);
        }

        if let Err(err) = window.close() {
           error!("{}",err);
        }
        return Ok(());
    }

    Err("Can't operate on given window".to_string())
}

#[tauri::command]
pub async fn logout<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {

    let url = format!("https://login.live.com/oauth20_logout.srf?client_id={client_id}&redirect_uri={redirect_uri}&scope=XboxLive.signin%20offline_access",client_id=env!("CLIENT_ID"),redirect_uri=REDIRECT_URI).to_string();

    let script = include_str!("./logout.js").replace("(:URL)", url.as_str());

    match WindowBuilder::new(&app, "ms-logout", WindowUrl::App(PathBuf::from("bootstrap.html"))).title("Microsoft Logout").initialization_script(script.as_str()).build() {
        Ok(_win) => {}
        Err(err) => return Err(err.to_string())
    }
  Ok(())
}

#[tauri::command]
pub async fn login<R: Runtime>(app: tauri::AppHandle<R>) -> Result<(), String> {

    let url = login::ms_login_url(String::from(env!("CLIENT_ID")), REDIRECT_URI.into());
  
    let script = include_str!("./login.js").replace("(:URL)", url.as_str());

    match WindowBuilder::new(&app, "ms-login", WindowUrl::App(PathBuf::from("bootstrap.html"))).title("Microsoft Login").initialization_script(script.as_str()).build() {
        Ok(_win) => {}
        Err(err) => return Err(err.to_string())
    }

    Ok(())
}
