use std::fmt::Display;

use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(
    Debug, Deserialize, Serialize, PartialEq, Eq, PartialOrd, Ord, Clone, Copy, sqlx::Type,
)]
pub enum Loader {
    Vanilla,
    Forge,
    Fabric,
    Quilt,
    Neoforge,
}

impl Display for Loader {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            match self {
                Loader::Vanilla => "Vanilla",
                Loader::Forge => "Forge",
                Loader::Fabric => "Fabric",
                Loader::Quilt => "Quilt",
                Loader::Neoforge => "Neoforge",
            }
        )
    }
}

impl Default for Loader {
    fn default() -> Self {
        Self::Vanilla
    }
}

impl From<String> for Loader {
    fn from(value: String) -> Self {
        match value.to_lowercase().as_str() {
            "quilt" => Self::Quilt,
            "forge" => Self::Forge,
            "fabric" => Self::Fabric,
            "neoforge" => Self::Neoforge,
            _ => Self::Vanilla,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Profile {
    pub id: String,

    pub name: String,

    pub date_created: NaiveDateTime,

    pub version: String,
    pub loader: Loader,

    pub last_played: Option<NaiveDateTime>,
    pub icon: Option<String>,
    pub loader_version: Option<String>,

    pub java_args: Option<String>,

    pub resolution_width: Option<String>,
    pub resolution_height: Option<String>,

    pub state: String,
}
