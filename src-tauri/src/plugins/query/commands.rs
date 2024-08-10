use std::collections::HashMap;

use crate::errors::Error;
use minecraft_launcher_lib::AppState;

#[tauri::command]
pub async fn select(
    state: tauri::State<'_, AppState>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<Vec<HashMap<String, serde_json::Value>>, Error> {
    Ok(state.database.select(&query, args).await?)
}

#[tauri::command]
pub async fn execute(
    state: tauri::State<'_, AppState>,
    query: String,
    args: Vec<serde_json::Value>,
) -> Result<(u64, i64), Error> {
    Ok(state.database.ececute(&query, args).await?)
}
