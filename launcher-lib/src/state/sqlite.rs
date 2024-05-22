use std::collections::HashMap;

use chrono::Utc;
use sqlx::migrate::MigrateDatabase;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions, SqliteValueRef};
use sqlx::{migrate::Migrator, Column, Row, TypeInfo, Value, ValueRef};

use crate::errors::LauncherError;

pub struct Database(pub SqlitePool);

impl Database {
    pub async fn exists(path: &str) -> bool {
        sqlx::sqlite::Sqlite::database_exists(path)
            .await
            .unwrap_or(false)
    }

    pub async fn create_db(path: &str) -> Result<(), LauncherError> {
        sqlx::sqlite::Sqlite::create_database(path)
            .await
            .map_err(LauncherError::Sqlite)
    }

    pub fn new(url: &str) -> Result<Self, LauncherError> {
        let opts = SqlitePoolOptions::new().connect_lazy(url)?;

        Ok(Self(opts))
    }

    pub async fn run_migrator(&self, miration_path: &std::path::Path) -> Result<(), LauncherError> {
        let migrator = Migrator::new(miration_path).await?;

        migrator.run(&self.0).await?;

        Ok(())
    }

    pub async fn select(
        &self,
        query: &str,
        values: Vec<serde_json::Value>,
    ) -> Result<Vec<HashMap<String, serde_json::Value>>, LauncherError> {
        let mut query = sqlx::query(query);

        for value in values {
            if value.is_null() {
                query = query.bind(None::<serde_json::Value>);
            } else if value.is_string() {
                query = query.bind(
                    value
                        .as_str()
                        .expect("Failed to convert value to str")
                        .to_owned(),
                );
            } else if value.is_number() {
                query = query.bind(value.as_f64().unwrap_or_default());
            } else {
                query = query.bind(value);
            }
        }

        let rows = query.fetch_all(&self.0).await?;

        let mut values = Vec::new();
        for row in rows {
            let mut value = HashMap::new();
            for (i, column) in row.columns().iter().enumerate() {
                let v = row.try_get_raw(i)?;

                let v = decode_to_json(v)?;

                value.insert(column.name().to_string(), v);
            }

            values.push(value);
        }

        Ok(values)
    }
    pub async fn ececute(
        &self,
        query: &str,
        values: Vec<serde_json::Value>,
    ) -> Result<(u64, i64), LauncherError> {
        let mut query = sqlx::query(query);

        for value in values {
            if value.is_null() {
                query = query.bind(None::<serde_json::Value>);
            } else if value.is_string() {
                query = query.bind(value.as_str().expect("Failed to convert to str").to_owned());
            } else if value.is_number() {
                query = query.bind(value.as_f64().unwrap_or_default())
            } else {
                query = query.bind(value);
            }
        }

        let result = query.execute(&self.0).await?;

        Ok((result.rows_affected(), result.last_insert_rowid()))
    }
}

fn decode_to_json(v: SqliteValueRef) -> Result<serde_json::Value, LauncherError> {
    if v.is_null() {
        return Ok(serde_json::Value::Null);
    }

    let res = match v.type_info().name() {
        "TEXT" => {
            if let Ok(v) = v.to_owned().try_decode() {
                serde_json::Value::String(v)
            } else {
                serde_json::Value::Null
            }
        }
        "REAL" => {
            if let Ok(v) = v.to_owned().try_decode::<f64>() {
                serde_json::Value::from(v)
            } else {
                serde_json::Value::Null
            }
        }
        "INTEGER" | "NUMERIC" => {
            if let Ok(v) = v.to_owned().try_decode::<i64>() {
                serde_json::Value::Number(v.into())
            } else {
                serde_json::Value::Null
            }
        }
        "BOOLEAN" => {
            if let Ok(v) = v.to_owned().try_decode() {
                serde_json::Value::Bool(v)
            } else {
                serde_json::Value::Null
            }
        }
        "TIME" | "DATE" | "DATETIME" => {
            if let Ok(v) = v.to_owned().try_decode::<chrono::DateTime<Utc>>() {
                serde_json::Value::String(v.to_string())
            } else {
                serde_json::Value::Null
            }
        }
        "BLOB" => {
            if let Ok(v) = v.to_owned().try_decode::<Vec<u8>>() {
                serde_json::Value::Array(
                    v.into_iter()
                        .map(|n| serde_json::Value::Number(n.into()))
                        .collect(),
                )
            } else {
                serde_json::Value::Null
            }
        }
        "NULL" => serde_json::Value::Null,
        _ => {
            return Err(LauncherError::Generic(format!(
                "Unspported datatype: {}",
                v.type_info().name().to_string()
            )))
        }
    };

    Ok(res)
}
