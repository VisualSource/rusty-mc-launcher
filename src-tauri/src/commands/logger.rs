use log::{info,error,debug,warn};

#[tauri::command]
pub async fn log(msg: String, level: Option<String>) -> () {
    if let Some(level) = level {
      match level.as_str() {
        "error" => error!("{}",msg),
        "debug" => debug!("{}",msg),
        "warn" => warn!("{}",msg),
        _ => info!("{}",msg)
      }
    } else {
      info!("{}",msg);
    }
}
