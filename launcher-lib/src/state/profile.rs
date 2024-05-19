use chrono::{DateTime, Utc};
use os_info::get;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::errors::LauncherError;

#[derive(Debug, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord)]
pub enum Loader {
    Vanilla,
    Forge,
    Fabric,
    Quilt,
}

impl Default for Loader {
    fn default() -> Self {
        Self::Vanilla
    }
}

impl TryFrom<&str> for Loader {
    type Error = LauncherError;

    fn try_from(value: &str) -> Result<Self, Self::Error> {
        Ok(serde_json::from_str::<Loader>(value)?)
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct Profile {
    pub id: Uuid,

    pub name: String,

    pub date_created: DateTime<Utc>,
    pub last_played: Option<DateTime<Utc>>,

    pub icon: Option<String>,
    pub version: String,
    pub loader: Loader,
    pub loader_version: Option<String>,

    pub additonal_java_arguments: Option<String>,

    pub resolution_width: Option<String>,
    pub resolution_height: Option<String>,
}

impl TryFrom<std::collections::HashMap<String, serde_json::Value>> for Profile {
    type Error = LauncherError;

    fn try_from(
        value: std::collections::HashMap<String, serde_json::Value>,
    ) -> Result<Self, Self::Error> {
        let id = value.get("id");
        let name = value.get("name");
        let date_created = value.get("date_crated");
        let last_played = value.get("last_played");
        let icon = value.get("icon");
        let version = value.get("version");
        let loader = value.get("loader");
        let loader_version = value.get("loader_version");

        let additonal_java_arguments = value.get("additonal_java_arguments");
        let resolution_width = value.get("resolution_width");
        let resolution_height = value.get("resolution_height");

        todo!()
    }
}

impl Profile {}
