use minecraft_launcher_lib::{Database, QueryResult};
use std::collections::HashMap;
use tokio::sync::RwLock;

#[tauri::command]
pub async fn select(
    state: tauri::State<'_, RwLock<Database>>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<QueryResult, String> {
    let l = state.read().await;
    l.select(query, args).await
}

#[tauri::command]
pub async fn execute(
    state: tauri::State<'_, RwLock<Database>>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<(u64, i64), String> {
    let w = state.write().await;
    w.execute(query, args)
}
