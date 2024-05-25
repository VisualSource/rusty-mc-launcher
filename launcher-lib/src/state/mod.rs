pub mod models;
mod process;
pub mod profile;
mod sqlite;
use std::{
    path::{Path, PathBuf},
    str::FromStr,
};

use models::{QueueItem, Setting};
use normalize_path::NormalizePath;

use profile::Profile;

use crate::errors::LauncherError;
pub use sqlite::Database;

pub struct AppState {
    pub instances: process::Instances,
    pub database: sqlite::Database,
}

impl AppState {
    pub fn new(path: &str) -> Result<Self, LauncherError> {
        Ok(Self {
            database: sqlite::Database::new(path)?,
            instances: process::Instances::new(),
        })
    }

    pub async fn get_profile(&self, id: &str) -> Result<Option<Profile>, LauncherError> {
        let query: Option<Profile> =
            sqlx::query_as!(Profile, "SELECT * FROM profiles WHERE id = ?", id)
                .fetch_optional(&self.database.0)
                .await?;

        Ok(query)
    }

    pub async fn set_profile_state(&self, profile: &str, state: &str) -> Result<(), LauncherError> {
        sqlx::query("UPDATE profiles SET state = ? WHERE id = ?")
            .bind(state)
            .bind(profile)
            .execute(&self.database.0)
            .await?;

        Ok(())
    }

    pub async fn set_queue_item_state(
        &self,
        item_id: &str,
        state: &str,
    ) -> Result<(), LauncherError> {
        sqlx::query("UPDATE download_queue SET state = ? WHERE id = ?")
            .bind(state)
            .bind(item_id)
            .execute(&self.database.0)
            .await?;

        Ok(())
    }

    pub async fn get_next_item(&self, running: bool) -> Result<Option<QueueItem>, LauncherError> {
        let has_current = sqlx::query_scalar!(
            "SELECT COUNT(*) as count FROM download_queue WHERE state = 'CURRENT';"
        )
        .fetch_one(&self.database.0)
        .await?;

        if has_current >= 1 {
            if !running {
                log::debug!("There is a current item that has not yet been processed");
                let item = sqlx::query_as!(
                    QueueItem,
                    "SELECT * FROM download_queue WHERE state = 'CURRENT' LIMIT 1;"
                )
                .fetch_one(&self.database.0)
                .await?;

                return Ok(Some(item));
            }

            return Ok(None);
        }

        let pending: Option<QueueItem> = sqlx::query_as!(
            QueueItem,
            "SELECT * FROM download_queue WHERE state = 'PENDING' ORDER BY install_order DESC LIMIT 1;",
        )
        .fetch_optional(&self.database.0)
        .await?;

        if let Some(item) = pending {
            sqlx::query("UPDATE download_queue SET state = 'CURRENT' WHERE id = ?;")
                .bind(&item.id)
                .execute(&self.database.0)
                .await?;

            Ok(Some(item))
        } else {
            Ok(None)
        }
    }

    pub async fn validate_java_at(path: &Path) -> Result<Option<String>, LauncherError> {
        let bytes = include_bytes!("../../library/JavaInfo.class");
        let temp_dir = std::env::temp_dir();
        let file_path = temp_dir.join("JavaInfo.class");
        tokio::fs::write(file_path, bytes).await?;

        let output = tokio::process::Command::new(path)
            .arg("-cp")
            .arg(temp_dir)
            .arg("JavaInfo")
            .output()
            .await?;

        let stdout = String::from_utf8_lossy(&output.stdout);

        let mut java_version = None;

        for line in stdout.lines() {
            let mut parts = line.split('=');
            let key = parts.next().unwrap_or_default();
            let value = parts.next().unwrap_or_default();

            if key == "java.version" {
                java_version = Some(value.to_string());
            }
        }

        Ok(java_version)
    }

    pub async fn insert_java(
        &self,
        version: usize,
        build: &str,
        path: &Path,
    ) -> Result<(), LauncherError> {
        if !(path.exists() && path.is_file()) {
            return Err(LauncherError::NotFound(
                "Invalid java execuatable path".to_string(),
            ));
        }

        let java_version = AppState::validate_java_at(path)
            .await?
            .ok_or(LauncherError::NotFound("Bad java".to_string()))?;
        log::info!("Found java {}", java_version);

        let column_key = format!("java.{}", version);
        let column_value = path.normalize().to_string_lossy().to_string();

        let mut query = sqlx::query("INSERT INTO settings VALUES (?,? ,?)");
        query = query.bind(column_key).bind(build).bind(column_value);

        query.execute(&self.database.0).await?;

        Ok(())
    }

    pub async fn get_java(&self, version: usize) -> Result<Option<String>, LauncherError> {
        let key = format!("java.{}", version);

        if let Some(settings) = self.get_setting(&key).await? {
            Ok(Some(settings.value))
        } else {
            Ok(None)
        }
    }

    pub async fn get_path(&self, key: &str) -> Result<PathBuf, LauncherError> {
        if let Some(setting) = self.get_setting(key).await? {
            PathBuf::from_str(&setting.value)
                .map_err(|_| LauncherError::Generic("Failed to convert str to path".to_string()))
        } else {
            Err(LauncherError::NotFound(format!(
                "No path was found for key: '{}'",
                key
            )))
        }
    }

    pub async fn get_setting(&self, setting: &str) -> Result<Option<Setting>, LauncherError> {
        let result = sqlx::query_as!(Setting, "SELECT * FROM settings WHERE key = ?", setting)
            .fetch_optional(&self.database.0)
            .await?;
        Ok(result)
    }

    pub async fn insert_setting(
        &self,
        key: &str,
        metadata: Option<String>,
        value: String,
    ) -> Result<(), LauncherError> {
        let query = sqlx::query("INSERT INTO settings VALUES (?,?,?)")
            .bind(key)
            .bind(metadata)
            .bind(value);

        query.execute(&self.database.0).await?;

        Ok(())
    }

    pub async fn has_setting(&self, setting: &str) -> Result<bool, LauncherError> {
        let query = sqlx::query("SELECT key FROM settings WHERE key = ?")
            .bind(setting)
            .fetch_optional(&self.database.0)
            .await?;

        Ok(query.is_some())
    }
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_get_path() {
        init();
        let p = std::env::current_dir()
            .expect("Failed to current dir")
            .join("migrations");

        let app = AppState::new("sqlite::memory:").expect("Failed to create");
        log::debug!("{}", p.to_string_lossy());
        app.database
            .run_migrator(&p)
            .await
            .expect("Failed to run migrations");

        let args = json!(["path.app", "Value", "C:\\"])
            .as_array()
            .expect("Failed to get array")
            .to_owned();

        app.database
            .ececute("INSERT INTO settings VALUES (?,?,?)", args)
            .await
            .expect("Failed to insert");

        let path = app.get_path("path.app").await.expect("Failed to get path");

        log::debug!("Get path: {}", path.to_string_lossy());
    }
}
