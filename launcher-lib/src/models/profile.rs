use crate::error::{Error, Result};
use serde::{Deserialize, Serialize};
use std::fmt::Display;

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

    pub date_created: time::OffsetDateTime,

    pub version: String,
    pub loader: Loader,

    pub last_played: Option<time::OffsetDateTime>,
    pub icon: Option<String>,
    pub loader_version: Option<String>,

    pub java_args: Option<String>,

    pub resolution_width: Option<String>,
    pub resolution_height: Option<String>,

    pub state: String,
}

impl Profile {
    pub fn version_id(&self) -> Result<String> {
        match &self.loader {
            Loader::Vanilla => Ok(self.version.to_owned()),
            Loader::Forge => Ok(format!(
                "{}-forge-{}",
                self.version,
                self.loader_version
                    .as_ref()
                    .ok_or_else(|| Error::NotFound("No loader version was found".to_string()))?
            )),
            Loader::Fabric => Ok(format!(
                "fabric-loader-{}-{}",
                self.loader_version
                    .as_ref()
                    .ok_or_else(|| Error::NotFound("No loader version was found".to_string()))?,
                self.version
            )),
            Loader::Quilt => Ok(format!(
                "quilt-loader-{}-{}",
                self.loader_version
                    .as_ref()
                    .ok_or_else(|| Error::NotFound("No loader version was found".to_string()))?,
                self.version
            )),
            Loader::Neoforge => Ok(format!(
                "neoforge-{}",
                self.loader_version
                    .as_ref()
                    .ok_or_else(|| Error::NotFound("No loader version was found".to_string()))?
            )),
        }
    }

    pub async fn get(id: &str, db: &crate::database::Database) -> Result<Option<Profile>> {
        let query = sqlx::query_as!(Profile, "SELECT * FROM profiles WHERE id = ?;", id)
            .fetch_optional(&db.0)
            .await?;
        Ok(query)
    }
    pub async fn set_loader_version(
        id: &str,
        version: &str,
        db: &crate::database::Database,
    ) -> Result<()> {
        sqlx::query("UPDATE profiles SET loader_version = ? WHERE id = ?")
            .bind(version)
            .bind(id)
            .execute(&db.0)
            .await?;

        Ok(())
    }
    pub async fn set_state(id: &str, state: &str, db: &crate::database::Database) -> Result<()> {
        sqlx::query("UPDATE profiles SET state = ? WHERE id = ?")
            .bind(state)
            .bind(id)
            .execute(&db.0)
            .await?;

        Ok(())
    }
}
