use mc_laucher_lib_rs::{
  client::ClientBuilder, 
  json::{ install::Event }, 
  Mod, 
  install_mods, 
  update_mods,
  install_jvm_runtime,
  utils::{
    read_manifest,
    get_minecraft_directory 
  }
};
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

#[tauri::command]
pub async fn install_runtime<R: Runtime>(window: tauri::Window<R>, minecraft_version: String) -> Result<(), String> {
  let game_dir = match get_minecraft_directory() {
    Ok(value) => value,
    Err(err) => return Err(err.to_string())
  };

  let dir = game_dir.join("versions").join(minecraft_version.clone()).join(format!("{}.json",minecraft_version));


  let version = match read_manifest(dir).await {
    Ok(value) => {
      match value.java_version {
        Some(runtime) => runtime.component,
        None => return Err("no runtime found".to_string())
      }
    }
    Err(err) => {
      return Err(err.to_string());
    }
  };

  if let Err(err) = install_jvm_runtime(version,game_dir,&|ev|{  
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
pub async fn update_mods_list<R: Runtime>(window: tauri::Window<R>, profile: String, mods: Vec<Mod>) -> Result<(), String> {
  let game_dir = match get_minecraft_directory() {
    Ok(value) => value,
    Err(err) => return Err(err.to_string())
  };

  if let Err(err) = update_mods(profile, game_dir, mods, &|ev|{  
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