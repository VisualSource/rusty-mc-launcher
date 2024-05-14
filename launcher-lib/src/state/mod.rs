use tokio::sync::RwLock;

mod java;
mod process;

#[derive(Debug)]
pub struct AppState {
    pub java: RwLock<java::JavaRuntimes>,
    pub instances: RwLock<process::Instances>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            java: RwLock::new(java::JavaRuntimes::new()),
            instances: RwLock::new(process::Instances::new()),
        }
    }
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}
