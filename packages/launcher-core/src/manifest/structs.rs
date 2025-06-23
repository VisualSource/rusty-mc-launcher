use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub path: Option<String>,
    pub id: Option<String>,
    pub total_size: Option<i32>,
    pub sha1: String,
    pub size: i32,
    pub url: String,
}
