use crate::error::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
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
    pub content_type: QueueType,
    pub metadata: Option<String>,
    pub state: QueueState,
}

impl QueueItem {
    pub async fn get_pending(db: &crate::database::Database) -> Result<Option<QueueItem>> {
        let has_current = sqlx::query_scalar!(
            "SELECT COUNT(*) as count FROM download_queue WHERE state = 'CURRENT';"
        )
        .fetch_one(&db.0)
        .await?;

        if has_current >= 1 {
            // if the app was closed during processing, restart with last known item.
            let item: Option<QueueItem> = sqlx::query_as!(
                QueueItem,
                "SELECT * FROM download_queue WHERE state = 'CURRENT' LIMIT 1;"
            )
            .fetch_optional(&db.0)
            .await?;

            if item.is_some() {
                return Ok(item);
            }
        }

        if let Some(pending) =
            sqlx::query_as!(QueueItem,
            "SELECT * FROM download_queue WHERE state = 'PENDING' ORDER BY priority DESC LIMIT 1;",
        )
            .fetch_optional(&db.0)
            .await?
        {
            QueueItem::set_state(&pending.id, QueueState::Current, db).await?;
            Ok(Some(pending))
        } else {
            Ok(None)
        }
    }

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
