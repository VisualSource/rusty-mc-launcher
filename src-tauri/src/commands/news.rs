use tauri::api::http::{ ClientBuilder, HttpRequestBuilder };
use std::collections::HashMap;

#[tauri::command]
pub async fn news(pages: i32) -> Result<String, String> {
    let client = match ClientBuilder::new().build() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };
    
    let query = HashMap::from([( "pageSize".to_string(), pages.to_string() )]);

    let request = match HttpRequestBuilder::new("GET","https://www.minecraft.net/content/minecraft-net/_jcr_content.articles.grid") {
        Ok(value) => value.query(query),
        Err(err) => return Err(err.to_string())
    };

    match client.send(request).await {
        Ok(res) => {
            match res.read().await {
                Ok(data) => {
                    match serde_json::to_string(&data.data) {
                        Ok(value) => Ok(value),
                        Err(err) => Err(err.to_string())
                    }
                }
                Err(err) => Err(err.to_string())
            }
        }
        Err(err) => Err(err.to_string())
    }

}