mod compression;
pub mod content;
mod download;
mod fabric;
mod fabric_core;
mod forge;
mod metadata;
pub mod minecraft;
mod neoforge;
mod quilt;
pub mod utils;

use serde::{Deserialize, Serialize};

use crate::models::profile::Loader;

//use crate::event;
//pub use utils::ChannelMessage;
#[derive(Debug, Deserialize, Serialize)]
pub struct InstallConfig {
    version: String,
    loader: Loader,
    loader_version: Option<String>,
}

impl InstallConfig {
    pub fn new(version: String, loader: Loader, loader_version: Option<String>) -> Self {
        Self {
            version,
            loader,
            loader_version,
        }
    }
}
