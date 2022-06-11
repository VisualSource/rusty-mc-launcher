use mc_laucher_lib_rs::{client::ClientBuilder, json::{ install::Event}};
use tauri::Runtime;
use app_dirs2::{AppDataType,app_dir};
use crate::consts::APP_INFO;

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
        Event::Download { state: _, msg } => {
          if let Err(err) = window.emit("rustydownload://download", msg){ eprintln!("{}",err); }
        },
        Event::Error(err) => {
          if let Err(err) = window.emit("rustydownload://error", err){ eprintln!("{}",err); }
        }
        Event::Progress { max, current } => {
          if let Err(err) = window.emit("rustydownload://progress", (max,current)){ eprintln!("{}",err); }
        }
        Event::Status(status) => {
          if let Err(err) = window.emit("rustydownload://status", status){ eprintln!("{}",err); }
        }
      }
    }, Some(temp), Some(cache), None).await {
    return Err(err.to_string());
  }
  Ok(())
}