use mc_laucher_lib_rs::{
    utils::{
        get_minecraft_directory,
        read_manifest_inherit
    },
    swap_mods_folder,
    does_runtime_exist
};
use log::error;
use tokio::fs::remove_dir_all;


#[tauri::command]
pub async fn remove_mods_folder(profile: String) -> Result<(), String> {
    let game_dir = match get_minecraft_directory() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    let dir = game_dir.join("system_mods").join(profile);

    if dir.is_dir() {
        if let Err(err) = remove_dir_all(dir).await {
            return Err(err.to_string());
        }
    }

    let mods_link = game_dir.join("mods");

    if mods_link.is_dir() {
        if let Err(err) = remove_dir_all(mods_link).await {
            return Err(err.to_string());
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn sawp_mods_folders(profile: String) -> Result<(), String> {
    let game_dir = match get_minecraft_directory() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    if let Err(err) = swap_mods_folder(profile,game_dir).await {
        return Err(err.to_string());
    }

    Ok(())
}


#[tauri::command]
pub async fn check_version(version: String) -> Result<(bool,&'static str), String> {

    let mc_dir = match get_minecraft_directory() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    let root = mc_dir.join("versions").join(version.clone());

    // check for version folder.
    if !root.is_dir() {
        return Ok((false,"no_root"));
    }

    let manifest = root.join(format!("{}.json",version));

    //check for version manifest
    if !manifest.is_file() {
        return Ok((false,"no_manifest"));
    }

    let jar = root.join(format!("{}.jar",version));

    // check for version jar file
    if !jar.is_file() {
        return Ok((false,"no_jar"));
    }

    // check for natives folder.
    if !root.join("natives").is_dir() {
        return Ok((false,"no_natives"));
    }

    // check for runtime
    match read_manifest_inherit(manifest,&mc_dir).await {
        Ok(value) => {
            match value.java_version {
                Some(version) => {
                    match does_runtime_exist(version.component,mc_dir) {
                        Ok(exits) => {
                            if !exits {
                                return Ok((false,"no_runtime"));
                            }
                        }
                        Err(err) => {
                            error!("{}",err);
                            return Err(err.to_string());
                        }
                    }
                },
                None =>  return Ok((false,"no_runtime"))
            }
        }
        Err(err) => {
            error!("{}",err);
            return Err(err.to_string());
        }
    };

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
