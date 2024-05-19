mod process;
mod profile;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
    str::FromStr,
};

use log::warn;
use normalize_path::NormalizePath;
use sqlite::{Connection, ConnectionThreadSafe};

use tokio::sync::RwLock;

use crate::errors::LauncherError;

pub struct AppState {
    pub instances: process::Instances,
    connection: RwLock<ConnectionThreadSafe>,
}

macro_rules! bind {
    ($statement:expr, $index:expr, $value:expr) => {
        match $value {
            serde_json::Value::Null => $statement.bind(($index + 1, ()))?,
            serde_json::Value::Bool(value) => {
                $statement.bind(($index + 1, value.to_owned() as i64))?;
            }
            serde_json::Value::Number(value) => match value.is_i64() {
                true => $statement.bind((
                    $index + 1,
                    value
                        .as_i64()
                        .ok_or(LauncherError::Generic("Failed to get i64".to_string()))?,
                ))?,
                false => $statement.bind((
                    $index + 1,
                    value
                        .as_f64()
                        .ok_or(LauncherError::Generic("Failed to get f64".to_string()))?,
                ))?,
            },
            serde_json::Value::String(value) => $statement.bind(($index + 1, value.as_str()))?,
            _ => warn!("Failed to bind sql value (Array|Object)"),
        }
    };
}

impl AppState {
    pub fn new<T>(path: T) -> Result<Self, LauncherError>
    where
        T: AsRef<std::path::Path>,
    {
        let connection = Connection::open_thread_safe(path)?;

        Ok(Self {
            connection: RwLock::new(connection),
            instances: process::Instances::new(),
        })
    }

    pub async fn execute(&self, sql: &str) -> Result<(), LauncherError> {
        let write = self.connection.write().await;
        write.execute(sql)?;

        Ok(())
    }

    pub async fn execute_with(
        &self,
        sql: &str,
        values: &[serde_json::Value],
    ) -> Result<bool, LauncherError> {
        let connection = self.connection.write().await;

        let mut statement = connection.prepare(sql)?;

        if values.first().is_some_and(|value| value.is_array()) {
            for value in values {
                for (i, v) in value
                    .as_array()
                    .ok_or(LauncherError::Generic(
                        "Failed to convert to array".to_string(),
                    ))?
                    .iter()
                    .enumerate()
                {
                    bind!(statement, i, v);
                }

                statement.next()?;
                statement.reset()?;
            }
            return Ok(true);
        }

        for (i, v) in values.iter().enumerate() {
            bind!(statement, i, v);
        }
        statement.next()?;
        Ok(true)
    }

    pub async fn select(
        &self,
        sql: &str,
        values: Vec<serde_json::Value>,
    ) -> Result<Vec<HashMap<String, serde_json::Value>>, LauncherError> {
        let connection = self.connection.read().await;
        let statement = connection.prepare(sql)?;

        let names = statement
            .column_names()
            .iter()
            .map(|name| name.to_owned())
            .collect::<Vec<String>>();

        let mut params = Vec::new();
        for (i, value) in values.iter().enumerate() {
            match value {
                serde_json::Value::Null => params.push((i + 1, sqlite::Value::Null)),
                serde_json::Value::Bool(value) => {
                    params.push((i + 1, sqlite::Value::Integer(value.to_owned() as i64)))
                }
                serde_json::Value::Number(num) => match num.is_i64() {
                    true => params.push((
                        i + 1,
                        sqlite::Value::Integer(num.as_i64().ok_or(LauncherError::Generic(
                            "Failed to convert to i64".to_string(),
                        ))?),
                    )),
                    false => params.push((
                        i + 1,
                        sqlite::Value::Float(num.as_f64().ok_or(LauncherError::Generic(
                            "Failed to convert to f64".to_string(),
                        ))?),
                    )),
                },
                serde_json::Value::String(value) => {
                    params.push((i + 1, sqlite::Value::String(value.to_owned())))
                }
                _ => warn!("Failed to bind sql value (Array|Object)"),
            }
        }

        let cursor = statement.into_iter().bind_iter(params)?;

        let mut rows = Vec::new();
        for mut item in cursor {
            let mut row = HashMap::new();
            for name in &names {
                let value = item
                    .as_mut()
                    .map_err(|_| LauncherError::Generic("Failed get item".to_string()))?
                    .take(name.as_str());

                let v = match value {
                    sqlite::Value::Binary(value) => serde_json::json!(value),
                    sqlite::Value::Float(v) => {
                        serde_json::Value::Number(serde_json::Number::from_f64(v).ok_or(
                            LauncherError::Generic("Failed to convert value".to_string()),
                        )?)
                    }
                    sqlite::Value::Integer(v) => {
                        serde_json::Value::Number(serde_json::Number::from(v))
                    }
                    sqlite::Value::String(v) => serde_json::Value::String(v),
                    sqlite::Value::Null => serde_json::Value::Null,
                };

                row.insert(name.to_owned(), v);
            }

            rows.push(row);
        }

        Ok(rows)
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

        let write = self.connection.write().await;
        let column_key = format!("java.{}", version);
        let column_value = path.normalize().to_string_lossy().to_string();
        write.execute(format!(
            "INSERT INTO settings VALUES ('{}', '{}', '{}')",
            column_key, build, column_value
        ))?;

        Ok(())
    }

    pub async fn get_java(&self, version: usize) -> Result<Option<String>, LauncherError> {
        let key = format!("java.{}", version);
        self.get_setting(&key).await
    }

    pub async fn get_path(&self, key: &str) -> Result<PathBuf, LauncherError> {
        let settings = self.get_setting(key).await?;

        if settings.is_none() {
            return Err(LauncherError::NotFound(format!(
                "No path was found for key: '{}'",
                key
            )));
        }

        PathBuf::from_str(&settings.unwrap())
            .map_err(|_| LauncherError::Generic("Failed to convert str to path".to_string()))
    }

    pub async fn get_setting(&self, setting: &str) -> Result<Option<String>, LauncherError> {
        let read = self.connection.read().await;
        let mut statement = read.prepare("SELECT value FROM settings WHERE key = ?;")?;
        statement.bind((1, setting))?;
        let values: Vec<Result<sqlite::Row, sqlite::Error>> = statement.into_iter().collect();

        if let Some(row) = values.first() {
            let item = row
                .as_ref()
                .map_err(|e| LauncherError::Generic(e.to_string()))?;

            let path = item.read::<&str, _>("value");

            return Ok(Some(path.to_string()));
        }

        Ok(None)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_select() {
        let app = AppState::new(":memory:").expect("Failed to build");
        app.execute("CREATE TABLE settings (key TEXT PRIMARY KEY, metadata TEXT, value TEXT)")
            .await
            .expect("Failed to create table");

        app.execute("INSERT INTO settings VALUES ('key.test','metadata','key.value')")
            .await
            .expect("Failed to execute");

        let value = app
            .select(
                "SELECT * FROM settings WHERE key = ?",
                vec![serde_json::Value::String("key.test".to_string())],
            )
            .await
            .expect("Failed to query");

        println!("{:#?}", value);
    }

    #[tokio::test]
    async fn test_get_java() {
        init();
        let app = AppState::new(":memory:").expect("Failed to build");
        app.execute("CREATE TABLE settings (key TEXT PRIMARY KEY, metadata TEXT, value TEXT)")
            .await
            .expect("Failed to create table");

        let result = app.get_java(21).await.expect("Failed to lock");

        assert_eq!(None, result);
    }

    #[tokio::test]
    async fn test_insert_java() {
        init();
        let app = AppState::new(":memory:").expect("Failed to build");
        app.execute("CREATE TABLE settings (key TEXT PRIMARY KEY, metadata TEXT, value TEXT)")
            .await
            .expect("Failed to create table");

        let path = std::env::temp_dir()
            .join("runtime\\java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe");

        app.insert_java(21, "1.21.", &path)
            .await
            .expect("Failed to insert");

        let result = app.get_java(21).await.expect("Failed to lock");

        assert_eq!(Some(path.normalize().to_string_lossy().to_string()), result);
    }
}
