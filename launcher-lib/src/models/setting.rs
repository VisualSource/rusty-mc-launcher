use std::{path::PathBuf, str::FromStr};

use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Setting {
    pub value: String,
    pub key: String,
    pub metadata: Option<String>,
}

impl Setting {
    pub async fn path(key: &str, db: &crate::database::Database) -> Result<Option<PathBuf>> {
        if let Some(setting) = Self::get(key, db).await? {
            let path = PathBuf::from_str(&setting.value)
                .map_err(|_| Error::Generic("Failed to create pathbuf".to_string()))?;
            return Ok(Some(path));
        }

        Ok(None)
    }

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
