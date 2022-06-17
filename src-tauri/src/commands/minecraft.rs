use mc_laucher_lib_rs::utils::get_minecraft_directory;

#[tauri::command]
pub async fn check_version(version: String) -> Result<(bool,&'static str), String> {

    let mc_dir = match get_minecraft_directory() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    let root = mc_dir.join("versions").join(version.clone());

    if !root.is_dir() {
        return Ok((false,"no_root"));
    }

    let manifest = root.join(format!("{}.json",version));

    if !manifest.is_file() {
        return Ok((false,"no_manifest"));
    }

    let jar = root.join(format!("{}.jar",version));

    if !jar.is_file() {
        return Ok((false,"no_jar"));
    }

    if !root.join("natives").is_dir() {
        return Ok((false,"no_natives"));
    }

    Ok((true,"ok"))
}

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


#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_check_version(){
        match check_version("1.19".to_string()).await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

}
