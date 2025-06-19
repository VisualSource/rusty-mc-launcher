use crate::error::{Error, Result};
use minecraft_launcher_lib::database::{Database, QueryResult};
use tokio::sync::RwLock;

#[tauri::command]
pub async fn select(
    state: tauri::State<'_, RwLock<Database>>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<QueryResult> {
    let l = state.read().await;
    l.select(query, args).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn execute(
    state: tauri::State<'_, RwLock<Database>>,
    query: String,
) -> Result<(u64, i64)> {
    let w = state.write().await;
    w.execute(&query).await.map_err(Error::Lib)
}

#[tauri::command]
pub async fn prepare(
    state: tauri::State<'_, RwLock<Database>>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<(u64, i64)> {
    let w = state.write().await;
    w.prepare(query, args).await.map_err(Error::Lib)
}
