use minecraft_launcher_lib::process::Processes;
use serde::Serialize;
use tokio::sync::RwLock;

pub const PROCESS_CRASH_EVENT: &str = "rmcl::process-crash";
pub const PROCESSES_STATE_EVENT: &str = "rmcl::process-state";

pub struct PluginGameState(pub RwLock<Processes>);
impl PluginGameState {
    pub fn new(data: Processes) -> Self {
        Self(RwLock::new(data))
    }
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type", content = "data")]
pub enum ProcessStatePayload {
    Remove(Vec<String>),
    Init(Vec<String>),
    Add(String),
}

#[derive(Debug, Serialize, Clone)]
pub struct ProcessCrashEvent {
    profile: String,
    code: i32,
}

impl ProcessCrashEvent {
    pub fn new(profile_id: String, code: i32) -> Self {
        Self {
            profile: profile_id,
            code,
        }
    }
}
