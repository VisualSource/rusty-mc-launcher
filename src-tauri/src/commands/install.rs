use mc_laucher_lib_rs::{client::ClientBuilder, json::{ install::Event}, Mod, install_mods, utils::get_minecraft_directory };
use tauri::Runtime;
use app_dirs2::{AppDataType,app_dir};
use crate::consts::APP_INFO;
use log::error;

#[tauri::command]
pub async fn install_mods_list<R: Runtime>(window: tauri::Window<R>, profile: String, mods: Vec<Mod>) -> Result<(), String> {
  let game_dir = match get_minecraft_directory() {
      Ok(value) => value,
      Err(err) => return Err(err.to_string())
  };
  if let Err(err) = install_mods(profile, game_dir, mods, &|ev|{  
    match ev {
      Event::Download { state, msg } => {
        if let Err(err) = window.emit("rustydownload://download", format!("{} {}",state.to_string(),msg)){ error!("{}",err); }
      },
      Event::Error(err) => {
        if let Err(err) = window.emit("rustydownload://error", err){ error!("{}",err); }
      }
      Event::Progress { max, current } => {
        if let Err(err) = window.emit("rustydownload://progress", (max,current)){ error!("{}",err); }
      }
      Event::Status(status) => {
        if let Err(err) = window.emit("rustydownload://status", status){ error!("{}",err); }
      }
    }
  }).await {
    return Err(err.to_string());
  }

  Ok(())
}

#[tauri::command]
pub async fn install_client<R: Runtime>(window: tauri::Window<R> ,manifest: String) -> Result<(), String> {

  let temp = match app_dir(AppDataType::UserConfig, &APP_INFO, "/temp") {
    Ok(value) => value,
    Err(err) => return Err(err.to_string())
  };

  let cache = match app_dir(AppDataType::UserConfig, &APP_INFO, "/cache") {
    Ok(value) => value,
    Err(err) => return Err(err.to_string())
  };

  if let Err(err) = ClientBuilder::install_str(manifest, None, 
    &|ev|{  
      match ev {
        Event::Download { state, msg } => {
          if let Err(err) = window.emit("rustydownload://download", format!("{} {}",state.to_string(),msg)){ error!("{}",err); }
        },
        Event::Error(err) => {
          if let Err(err) = window.emit("rustydownload://error", err){ error!("{}",err); }
        }
        Event::Progress { max, current } => {
          if let Err(err) = window.emit("rustydownload://progress", (max,current)){ error!("{}",err); }
        }
        Event::Status(status) => {
          if let Err(err) = window.emit("rustydownload://status", status){ error!("{}",err); }
        }
      }
    }, Some(temp), Some(cache), None).await {
    return Err(err.to_string());
  }
  Ok(())
}

#[tauri::command]
pub async fn install_natives<R: Runtime>(window: tauri::Window<R>, version: String) -> Result<(), String> {

  if let Err(err) = ClientBuilder::install_natives(version, None, 
    &|ev|{  
      match ev {
        Event::Download { state, msg } => {
          if let Err(err) = window.emit("rustydownload://download", format!("{} {}",state.to_string(),msg)){ error!("{}",err); }
        },
        Event::Error(err) => {
          if let Err(err) = window.emit("rustydownload://error", err){ error!("{}",err); }
        }
        Event::Progress { max, current } => {
          if let Err(err) = window.emit("rustydownload://progress", (max,current)){ error!("{}",err); }
        }
        Event::Status(status) => {
          if let Err(err) = window.emit("rustydownload://status", status){ error!("{}",err); }
        }
      }
    }).await {
    return Err(err.to_string());
  }
  Ok(())
}