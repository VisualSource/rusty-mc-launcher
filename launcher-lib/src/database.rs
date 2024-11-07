use std::path::PathBuf;
use std::str::FromStr;

use futures::TryFutureExt;
use time::{Date, PrimitiveDateTime, Time};

use crate::error::{Error, Result};
use crate::models::setting::Setting;
use indexmap::IndexMap;
use sqlx::migrate::MigrateDatabase;
use sqlx::sqlite::{Sqlite, SqlitePool, SqlitePoolOptions, SqliteValueRef};
use sqlx::{migrate::Migrator, Column, Row, TypeInfo, Value, ValueRef};

pub type QueryResult = Vec<IndexMap<String, serde_json::Value>>;
pub struct Database(pub SqlitePool);

impl Database {
    pub async fn get_setting(&self, key: &str) -> Result<Option<Setting>> {
        sqlx::query_as!(Setting, "SELECT * FROM settings WHERE key = ?", key)
            .fetch_optional(&self.0)
            .map_err(Error::Sqlx)
            .await
    }

    pub async fn get_setting_as_path(&self, key: &str) -> Result<PathBuf> {
        let setting = self.get_setting(key).await?;

        if let Some(s) = setting {
            return PathBuf::from_str(&s.value)
                .map_err(|_| Error::Generic("Failed to make pathbuf".into()));
        }

        Err(Error::Generic(format!(
            "Failed to get path from setting '{}'",
            key
        )))
    }

    pub async fn close(&self) {
        self.0.close().await;
    }
    pub async fn new(path: &std::path::Path, db_name: &str) -> Result<Database> {
        let db_path = path.join(db_name);
        let db_path_str = db_path
            .to_str()
            .ok_or_else(|| Error::Generic("Failed to convert path to str".into()))?;

        let conn_str = db_path_str
            .split_once(':')
            .map(|(_, a)| format!("sqlite:{}", a))
            .ok_or_else(|| Error::Generic("Failed to get database connection string".into()))?;

        if Sqlite::database_exists(&conn_str).await? {
            Sqlite::create_database(&conn_str).await?;
        }

        let db = SqlitePoolOptions::new().connect_lazy(&conn_str)?;
        Ok(Self(db))
    }

    pub async fn run_migrations(&self, migrations_path: &std::path::Path) -> Result<()> {
        let migrator = Migrator::new(migrations_path).await?;

        migrator.run(&self.0).await?;

        Ok(())
    }

    pub async fn execute(&self, query: String, args: Vec<serde_json::Value>) -> Result<(u64, i64)> {
        let mut stmt = sqlx::query(&query);

        for arg in args {
            if arg.is_null() {
                stmt = stmt.bind(None::<serde_json::Value>);
            } else if arg.is_string() {
                stmt = stmt.bind(arg.as_str().unwrap().to_owned());
            } else if arg.is_number() {
                stmt = stmt.bind(arg.as_f64().unwrap_or_default())
            } else {
                stmt = stmt.bind(arg)
            }
        }

        let result = stmt.execute(&self.0).await?;
        Ok((result.rows_affected(), result.last_insert_rowid()))
    }
    pub async fn select(&self, query: String, args: Vec<serde_json::Value>) -> Result<QueryResult> {
        let mut stmt = sqlx::query(&query);

        for arg in args {
            if arg.is_null() {
                stmt = stmt.bind(None::<serde_json::Value>);
            } else if arg.is_string() {
                stmt = stmt.bind(arg.as_str().unwrap().to_owned())
            } else if arg.is_number() {
                stmt = stmt.bind(arg.as_f64().unwrap_or_default())
            } else {
                stmt = stmt.bind(arg);
            }
        }

        let rows = stmt.fetch_all(&self.0).await?;
        let mut values = Vec::new();
        for row in rows {
            let mut value = IndexMap::default();
            for (i, col) in row.columns().iter().enumerate() {
                let v = row.try_get_raw(i)?;
                let v = to_json(v)?;
                value.insert(col.name().to_string(), v);
            }
            values.push(value);
        }

        Ok(values)
    }
}

fn to_json(v: SqliteValueRef) -> Result<serde_json::Value> {
    if v.is_null() {
        return Ok(serde_json::Value::Null);
    }

    match v.type_info().name() {
        "TEXT" => v
            .to_owned()
            .try_decode()
            .map(serde_json::Value::String)
            .or_else(|_| Ok(serde_json::Value::Null)),
        "REAL" => v
            .to_owned()
            .try_decode::<f64>()
            .map(serde_json::Value::from)
            .or_else(|_| Ok(serde_json::Value::Null)),
        "INTEGER" | "NUMERIC" => v
            .to_owned()
            .try_decode::<i64>()
            .map(|v| serde_json::Value::Number(v.into()))
            .or_else(|_err| Ok(serde_json::Value::Null)),
        "BOOLEAN" => v
            .to_owned()
            .try_decode()
            .map(serde_json::Value::Bool)
            .or_else(|_| Ok(serde_json::Value::Null)),
        "DATE" => v
            .to_owned()
            .try_decode::<Date>()
            .map(|v| serde_json::Value::String(v.to_string()))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "TIME" => v
            .to_owned()
            .try_decode::<Time>()
            .map(|v| serde_json::Value::String(v.to_string()))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "DATETIME" => v
            .to_owned()
            .try_decode::<PrimitiveDateTime>()
            .map(|v| serde_json::Value::String(v.to_string()))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "BLOB" => v
            .to_owned()
            .try_decode::<Vec<u8>>()
            .map(|v| {
                serde_json::Value::Array(
                    v.into_iter()
                        .map(|n| serde_json::Value::Number(n.into()))
                        .collect(),
                )
            })
            .or_else(|_| Ok(serde_json::Value::Null)),
        "NULL" => Ok(serde_json::Value::Null),
        _ => Err(Error::Generic(format!(
            "UnsupportedDatatype: {}",
            v.type_info().name()
        ))),
    }
}
