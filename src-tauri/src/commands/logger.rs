use log::error;

#[tauri::command]
pub async fn error(msg: String) -> () {
  error!("{}",msg);
}