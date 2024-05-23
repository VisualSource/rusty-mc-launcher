use crate::errors;
use std::path::PathBuf;

pub mod auth;
pub mod game;
pub mod query;

#[tauri::command]
pub async fn show_in_folder(path: PathBuf) -> Result<(), errors::Error> {
    #[cfg(target_os = "windows")]
    {
        let path_str = path.to_string_lossy().to_string();

        log::debug!("Opening path: {}", path_str);

        tokio::process::Command::new("explorer")
            .arg(&path_str)
            .spawn()?;
    }

    #[cfg(target_os = "linux")]
    {
        unimplemented!()
    }

    #[cfg(target_os = "macos")]
    {
        unimplemented!()
    }

    Ok(())
}
