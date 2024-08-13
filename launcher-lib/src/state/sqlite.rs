use time::{Date, PrimitiveDateTime, Time};

use crate::errors::LauncherError;
use indexmap::IndexMap;
use sqlx::migrate::MigrateDatabase;
use sqlx::sqlite::{SqlitePool, SqlitePoolOptions, SqliteValueRef};
use sqlx::{migrate::Migrator, Column, Row, TypeInfo, Value, ValueRef};

pub type QueryResult = Vec<IndexMap<String, serde_json::Value>>;
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

    pub fn new_from_path(path: &std::path::Path, db_name: &str) -> Result<Database, LauncherError> {
        let database_file = path.join(db_name);
        let db_str = database_file.to_string_lossy().to_string();
        let no_dive = db_str
            .split_once(':')
            .expect("Failed to parse connection string for database!")
            .1;
        let conn_str = format!("sqlite:{}", no_dive);
        Self::new(&conn_str)
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

    pub async fn execute(
        &self,
        query: String,
        args: Vec<serde_json::Value>,
    ) -> Result<(u64, i64), LauncherError> {
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
    pub async fn select(
        &self,
        query: String,
        args: Vec<serde_json::Value>,
    ) -> Result<QueryResult, LauncherError> {
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

fn to_json(v: SqliteValueRef) -> Result<serde_json::Value, LauncherError> {
    if v.is_null() {
        return Ok(serde_json::Value::Null);
    }

    match v.type_info().name() {
        "TEXT" => v
            .to_owned()
            .try_decode()
            .and_then(|v| Ok(serde_json::Value::String(v)))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "REAL" => v
            .to_owned()
            .try_decode::<f64>()
            .and_then(|v| Ok(serde_json::Value::from(v)))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "INTEGER" | "NUMERIC" => v
            .to_owned()
            .try_decode::<i64>()
            .and_then(|v| Ok(serde_json::Value::Number(v.into())))
            .or_else(|_err| Ok(serde_json::Value::Null)),
        "BOOLEAN" => v
            .to_owned()
            .try_decode()
            .and_then(|v| Ok(serde_json::Value::Bool(v)))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "DATE" => v
            .to_owned()
            .try_decode::<Date>()
            .and_then(|v| Ok(serde_json::Value::String(v.to_string())))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "TIME" => v
            .to_owned()
            .try_decode::<Time>()
            .and_then(|v| Ok(serde_json::Value::String(v.to_string())))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "DATETIME" => v
            .to_owned()
            .try_decode::<PrimitiveDateTime>()
            .and_then(|v| Ok(serde_json::Value::String(v.to_string())))
            .or_else(|_| Ok(serde_json::Value::Null)),
        "BLOB" => v
            .to_owned()
            .try_decode::<Vec<u8>>()
            .and_then(|v| {
                Ok(serde_json::Value::Array(
                    v.into_iter()
                        .map(|n| serde_json::Value::Number(n.into()))
                        .collect(),
                ))
            })
            .or_else(|_| Ok(serde_json::Value::Null)),
        "NULL" => Ok(serde_json::Value::Null),
        _ => {
            return Err(LauncherError::Generic(format!(
                "UnsupportedDatatype: {}",
                v.type_info().name().to_string()
            )))
        }
    }
}
