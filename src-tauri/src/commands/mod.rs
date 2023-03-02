use tauri::Window ;
use minecraft_launcher_lib::ClientBuilder;

use crate::state::TauriState;
use crate::errors::Error;

#[tauri::command]
pub async fn play(settings: ClientBuilder, window: Window, state: tauri::State<'_,TauriState>) -> Result<(), Error> {
  let client = settings.build().await?; 

  Ok(())
}