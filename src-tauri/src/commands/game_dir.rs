use mc_laucher_lib_rs::utils::get_minecraft_directory;

#[tauri::command]
pub async fn game_dir() -> Result<String, String> {
    match get_minecraft_directory() {
        Ok(value) => {
            match value.to_str() {
                Some(path) => Ok(path.to_string()),
                None => Err("Failed to convent pathbuf to utf8 string".to_string())
            } 
        }
        Err(err)=> Err(err.to_string())
    }
}