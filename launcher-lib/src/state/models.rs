use crate::error::Result;
use serde::{Deserialize, Serialize};
use time::PrimitiveDateTime;

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

impl ToString for QueueState {
    fn to_string(&self) -> String {
        match self {
            QueueState::Pending => "PENDING".into(),
            QueueState::Errored => "ERRORED".into(),
            QueueState::Current => "CURRENT".into(),
            QueueState::Postponed => "POSTPONED".into(),
            QueueState::Completed => "COMPLETED".into(),
            QueueState::Unknown => "UNKNOWN".into(),
        }
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
    pub created: PrimitiveDateTime,
    pub content_type: QueueType,
    pub metadata: Option<String>,
    pub state: QueueState,
}

impl QueueItem {
    pub async fn delete(id: &str, db: &crate::database::Database) -> Result<()> {
        sqlx::query("DELETE FROM download_queue WHERE id = ?;")
            .bind(id)
            .execute(&db.0)
            .await?;
        Ok(())
    }
    pub async fn set_state(
        id: &str,
        state: QueueState,
        db: &crate::database::Database,
    ) -> Result<()> {
        sqlx::query("UPDATE download_queue SET state = ? WHERE id = ?;")
            .bind(state.to_string())
            .bind(id)
            .execute(&db.0)
            .await?;
        Ok(())
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub value: String,
    pub key: String,
    pub metadata: Option<String>,
}

impl Setting {
    pub async fn get(key: &str, db: &crate::database::Database) -> Result<Option<Setting>> {
        let query = sqlx::query_as!(Setting, "SELECT * FROM settings WHERE key = ?;", key)
            .fetch_optional(&db.0)
            .await?;
        Ok(query)
    }
    pub async fn insert(
        key: &str,
        value: String,
        metadata: Option<String>,
        db: &crate::database::Database,
    ) -> Result<()> {
        sqlx::query("INSERT INTO settings VALUES (?,?,?);")
            .bind(key)
            .bind(metadata)
            .bind(value)
            .execute(&db.0)
            .await?;
        Ok(())
    }
    pub async fn has(key: &str, db: &crate::database::Database) -> Result<bool> {
        let query = sqlx::query("SELECT key FROM settings WHERE key = ?;")
            .bind(key)
            .fetch_optional(&db.0)
            .await?;
        Ok(query.is_some())
    }
}
