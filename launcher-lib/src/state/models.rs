use chrono::NaiveDateTime;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub enum QueueType {
    Client,
    Modpack,
    Mod,
    Resourcepack,
    Shader,
    Datapack,
    CurseforgeModpack,
}

impl Default for QueueType {
    fn default() -> Self {
        Self::Client
    }
}

impl From<String> for QueueType {
    fn from(value: String) -> Self {
        match value.to_lowercase().as_str() {
            "datapack" => Self::Datapack,
            "modpack" => Self::Modpack,
            "mod" => Self::Mod,
            "resourcepack" => Self::Resourcepack,
            "shader" => Self::Shader,
            "curseforgemodpack" => Self::CurseforgeModpack,
            _ => Self::Client,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub enum QueueState {
    Pending,
    Errored,
    Current,
    Postponed,
    Completed,
    Unknown,
}

impl Default for QueueState {
    fn default() -> Self {
        Self::Pending
    }
}

impl From<String> for QueueState {
    fn from(value: String) -> Self {
        match value.to_uppercase().as_str() {
            "PENDING" => Self::Pending,
            "ERRORED" => Self::Errored,
            "CURRENT" => Self::Current,
            "POSTPONED" => Self::Postponed,
            "COMPLETED" => Self::Completed,
            _ => Self::Unknown,
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct QueueItem {
    pub id: String,
    pub display: bool,
    pub install_order: i64,
    pub display_name: String,
    pub icon: Option<String>,
    pub profile_id: String,
    pub created: NaiveDateTime,
    pub content_type: QueueType,
    pub metadata: Option<String>,
    pub state: QueueState,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub value: String,
    pub key: String,
    pub metadata: Option<String>,
}
