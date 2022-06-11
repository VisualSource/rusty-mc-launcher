use crate::utils::get_http_client;
use crate::expections::{ LauncherLibError, LibResult };
use crate::json::{
    launcher_version::{
        VersionsManifestLatest, 
        VersionsManifestVersion, 
        VersionsManifest
    }
};

const MINECRAFT_MANIFEST: &str = "https://launchermeta.mojang.com/mc/game/version_manifest.json";

/// Returns the latest version of Minecraft
pub async fn get_latest_vanilla_version() -> LibResult<VersionsManifestLatest> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(MINECRAFT_MANIFEST).send().await {
        Ok(value) => {
            match value.json::<VersionsManifest>().await {
                Ok(request) => {
                    Ok(request.latest)
                }
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))   
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to fetch Minecraft latest version".into()
        })
    }
}

/// Returns all versions that Mojang offers to download
pub async fn get_vanilla_versions() -> LibResult<Vec<VersionsManifestVersion>> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(MINECRAFT_MANIFEST).send().await {
        Ok(value) => {
            match value.json::<VersionsManifest>().await {
                Ok(request) => {
                    Ok(request.versions)
                }
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))       
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
             msg: "Failed to fetch Minecraft latest version".into()
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn test_get_latest_vanilla_version() {
            match get_latest_vanilla_version().await {
                Ok(value) => {
                    println!("{:#?}",value);
                }
                Err(err) => {
                    eprintln!("{}",err);
                }
            }
    }
    #[tokio::test]
    async fn test_get_vanilla_versions() {
            match get_vanilla_versions().await {
                Ok(value) => {
                    println!("{:#?}",value);
                }
                Err(err) => {
                    eprintln!("{}",err);
                }
            }
    }
}