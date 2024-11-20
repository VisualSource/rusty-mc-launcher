use minecraft_launcher_lib::process::Processes;
use serde::Serialize;
use tokio::sync::RwLock;
pub struct PluginGameState(pub RwLock<Processes>);
impl PluginGameState {
    pub fn new(data: Processes) -> Self {
        Self(RwLock::new(data))
    }
}

#[derive(Debug, Serialize, Clone)]
pub enum ProcessStatePayload {
    Add(Vec<String>),
    Remove(Vec<String>),
    Starting(String),
}
