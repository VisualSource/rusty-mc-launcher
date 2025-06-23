use serde::{Deserialize, Serialize};

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct AssetIndexItem {
    pub hash: String,
    pub size: i32,
}

/// struct reps of the download for minecraft assets
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct AssetIndex {
    pub objects: std::collections::HashMap<String, AssetIndexItem>,
}
