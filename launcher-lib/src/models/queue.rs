use crate::{
    database::RwDatabase,
    error::{Error, Result},
};
use serde::{Deserialize, Serialize};
use time::format_description::well_known::Rfc3339;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum QueueType {
    Client,
    Modpack,
    Mod,
    Resourcepack,
    Shader,
    Datapack,
    CurseforgeModpack,
    Update,
    Unknown,
}

impl Default for QueueType {
    fn default() -> Self {
        Self::Unknown
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
            "update" => Self::Update,
            "client" => Self::Client,
            _ => Self::Unknown,
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

impl std::fmt::Display for QueueState {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let value = match self {
            QueueState::Pending => "PENDING",
            QueueState::Errored => "ERRORED",
            QueueState::Current => "CURRENT",
            QueueState::Postponed => "POSTPONED",
            QueueState::Completed => "COMPLETED",
            QueueState::Unknown => "UNKNOWN",
        };
        write!(f, "{}", value)
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
    pub priority: i64,
    pub display_name: String,
    pub icon: Option<String>,
    pub profile_id: String,
    pub created: time::OffsetDateTime,
    pub completed: Option<time::OffsetDateTime>,
    pub content_type: QueueType,
    pub metadata: Option<String>,
    pub state: QueueState,
}

impl QueueItem {
    pub async fn get_pending(rwdb: &RwDatabase) -> Result<Option<QueueItem>> {
        let (result, was_existing) = {
            let db = rwdb.read().await;
            let item: Option<QueueItem> = sqlx::query_as!(
                QueueItem,
                "SELECT * FROM download_queue WHERE state = 'CURRENT' ORDER BY priority DESC LIMIT 1;"
            )
            .fetch_optional(&db.0)
            .await?;

            if item.is_some() {
                (item, true)
            } else {
                (sqlx::query_as!(QueueItem,
                    "SELECT * FROM download_queue WHERE state = 'PENDING' ORDER BY priority DESC LIMIT 1;",
                )
                    .fetch_optional(&db.0)
                    .await?,false)
            }
        };

        if let Some(item) = &result {
            if !was_existing {
                QueueItem::set_state(&item.id, QueueState::Current, rwdb).await?;
            }
        }

        Ok(result)
    }

    pub async fn delete(id: &str, rwdb: &RwDatabase) -> Result<()> {
        let db = rwdb.write().await;

        sqlx::query("DELETE FROM download_queue WHERE id = ?;")
            .bind(id)
            .execute(&db.0)
            .await?;
        Ok(())
    }

    pub async fn set_state(id: &str, state: QueueState, rwdb: &RwDatabase) -> Result<()> {
        let db = rwdb.write().await;

        let state_str = state.to_string();
        match state {
            QueueState::Pending
            | QueueState::Postponed
            | QueueState::Unknown
            | QueueState::Current => {
                sqlx::query!(
                    "UPDATE download_queue SET state = ? WHERE id = ?;",
                    state_str,
                    id
                )
                .execute(&db.0)
                .await?;
            }
            _ => {
                let now = std::time::SystemTime::now();
                let offset: time::OffsetDateTime = now.into();
                let timestamp = offset
                    .format(&Rfc3339)
                    .map_err(|e| Error::Generic(e.to_string()))?;
                sqlx::query!(
                    "UPDATE download_queue SET state = ?, completed = ? WHERE id = ?;",
                    state_str,
                    timestamp,
                    id
                )
                .execute(&db.0)
                .await?;
            }
        }

        Ok(())
    }
}
