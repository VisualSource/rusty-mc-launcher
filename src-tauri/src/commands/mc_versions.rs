use mc_laucher_lib_rs::{ vanilla, fabric, forge, optifine };


async fn optifine_loader_versions(minecraft: String) -> Result<Vec<String>,String> {
    match optifine::get_optifine_versions().await {
        Ok(value) => {
            let res = value.iter().filter_map(|f|{
                if f.mc != minecraft { return None; }
                Some(f.name.clone())
            }).collect::<Vec<String>>();
            Ok(res)
        }
        Err(err) => Err(err.to_string())
    }
}
async fn forge_loader_versions(version: &str) -> Result<Vec<String>, String> {
    match forge::get_forge_versions().await {
        Ok(versions) => {
            let res = versions.iter().filter_map(|f|{
                let data = f.split("-").collect::<Vec<&str>>();
                if version != data[0] {return None; }

                Some(data[1].to_string())

            }).collect::<Vec<String>>();


            Ok(res)
        }
        Err(err) => Err(err.to_string())
    }
}
async fn fabric_loader_versions() -> Result<Vec<String>, String> {
    match fabric::get_loader_versions().await {
        Ok(value) => {
            Ok(value.iter().map(|f|{ f.version.clone() }).collect::<Vec<String>>())
        }
        Err(err) => Err(err.to_string())
    }
}

#[tauri::command]
pub async fn get_loader_versions(loader: &str, minecraft: String) -> Result<Vec<String>, String> {
    match loader {
        "forge" => {
            forge_loader_versions(minecraft.as_str()).await
        }
        "fabric" => {
            fabric_loader_versions().await
        }
        "optifine" => {
            optifine_loader_versions(minecraft).await
        }
        _ => Ok(vec![])
    }
}

#[tauri::command]
pub async fn get_vanilla_versions() -> Result<Vec<String>, String> {
    match vanilla::get_vanilla_versions().await  {
        Ok(versions) => {
            let opt = semver_rs::Options { loose: false, include_prerelease: false };
            let res = versions.iter().filter_map(|f|{ 

                if f.version_type == "snapshot" || f.version_type == "old_alpha" || f.version_type == "old_beta" {
                    return None;
                }

                let id = match semver_rs::parse(&f.id, opt) {
                    Ok(value) => {
                        if value.is_empty() {
                            format!("{}.0",f.id)
                        } else {
                            value.to_string()
                        }
                    }
                    Err(_err) => return None
                };
            
                match semver_rs::satisfies(&id, ">=1.16.5", opt) {
                    Ok(value) => {
                        if value { Some(f.id.clone()) } else { None }
                    }
                    Err(_err) => None
                }
            }).collect::<Vec<String>>();
            
            
            Ok(res)
        }
        Err(err) => Err(err.to_string())
    }
}