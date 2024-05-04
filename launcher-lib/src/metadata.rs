use crate::errors::LauncherLibError;
use serde::Deserialize;

const LAUNCHER_META: &str = "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json";

#[derive(Deserialize, Debug, Clone)]
pub struct VersionManifestItem {
    pub id: String,
    pub url: String,
    #[serde(alias = "type")]
    pub version_type: String,
    #[serde(alias = "releaseTime")]
    pub release_time: String,
    pub sha1: String,
    #[serde(alias = "complianceLevel")]
    pub compliance_level: usize,
}

#[derive(Deserialize, Debug)]
struct VersionManifestLastest {
    release: String,
    //snapshot: String
}

#[derive(Deserialize, Debug)]
struct VersionManifest {
    latest: VersionManifestLastest,
    versions: Vec<VersionManifestItem>,
}

pub async fn get_launcher_manifest(
    version: Option<String>,
) -> Result<VersionManifestItem, LauncherLibError> {
    let resp = reqwest::get(LAUNCHER_META)
        .await?
        .json::<VersionManifest>()
        .await?;

    let mc_version = version.unwrap_or(resp.latest.release);

    if let Some(data) = resp.versions.iter().find(|x| x.id == mc_version) {
        return Ok(data.to_owned());
    }

    Err(LauncherLibError::NotFound("minecraft version".to_string()))
}

#[cfg(test)]
mod tests {
    use super::*;
    //https://docs.rs/tokio/latest/tokio/attr.test.html
    #[tokio::test]
    async fn test_get_launcher_manifest() -> Result<(), ()> {
        let version = "1.17.1".to_string();

        if let Ok(data) = get_launcher_manifest(Some(version.clone())).await {
            print!("{:#?}", data);

            assert_eq!(data.id, version);
            assert_eq!(data.url,"https://launchermeta.mojang.com/v1/packages/a769e66272ae058c60c27a11b5adb04d7065884a/1.17.1.json".to_string());

            return Ok(());
        }

        panic!("Failed to get manifest");
    }
}
