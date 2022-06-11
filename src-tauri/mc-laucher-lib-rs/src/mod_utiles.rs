use crate::utils::get_http_client;
use crate::expections::{ LauncherLibError, LibResult };
use serde::Deserialize;
#[derive(Deserialize, Debug,Clone)]
pub struct Version {
   #[serde(rename="$value")]
   pub version: Vec<String>
}

#[derive(Deserialize, Debug,Clone)]
pub struct MavenVersioning {
    pub latest: String,
    pub release: String,
    #[serde(rename="lastUpdated")]
    pub last_updated: String,
    pub versions: Version
}

#[derive(Deserialize, Debug,Clone)]
pub struct MavenMetadata {
    #[serde(rename="groupId")]
    pub group_id: String,
    #[serde(rename="artifactId")]
    pub artifact_id: String,
    pub versioning: MavenVersioning
}

pub async fn get_metadata(root_url: &str) -> LibResult<MavenMetadata> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(format!("{}maven-metadata.xml",root_url).as_str()).send().await {
        Ok(response) => {
            match response.text().await {
                Ok(value) => {
                    match serde_xml_rs::from_str::<MavenMetadata>(&value) {
                        Ok(res) => Ok(res),
                        Err(err) => Err(LauncherLibError::General(err.to_string()))
                    }
                }
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to make http request".into()
        })
    }
}