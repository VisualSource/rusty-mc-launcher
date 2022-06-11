use mc_laucher_lib_rs::utils::{get_minecraft_directory};

#[tauri::command]
pub async fn check_version(version: String) -> Result<bool, String> {

    let mc_dir = match get_minecraft_directory() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    let root = mc_dir.join("versions").join(version.clone());

    if !root.is_dir() {
        return Ok(false);
    }

    let manifest = root.join(format!("{}.json",version));
    let jar = root.join(format!("{}.jar",version));

    Ok(manifest.is_file() && jar.is_file())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_check_version(){
        match check_version("1.19".to_string()).await {
            Ok(value) => println!("{}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

}
