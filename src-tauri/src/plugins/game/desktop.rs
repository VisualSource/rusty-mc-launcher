use minecraft_launcher_lib::database::RwDatabase;
use minecraft_launcher_lib::process::Processes;
use serde::Serialize;
use tauri::{AppHandle, Emitter, Manager, Runtime};
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
    List(Vec<String>),
    Add(String),
}

#[derive(Debug, Serialize, Clone)]
pub struct ProcessCrashEvent {
    profile: String,
    code: i32,
    details: String,
}

impl ProcessCrashEvent {
    pub fn new(profile: String, details: String, code: i32) -> Self {
        Self {
            profile,
            code,
            details,
        }
    }
}

pub async fn process_watcher<R: Runtime>(app: &AppHandle<R>) {
    let state = app.state::<PluginGameState>();

    let removable = {
        let mut ps_list = state.0.write().await;

        let mut removable = Vec::new();
        for (uuid, ps) in &mut ps_list.state {
            let profile_id = ps.profile_id.clone();

            let status = ps
                .status()
                .await
                .map(|status| status.unwrap_or(-1))
                .unwrap_or_default();

            match status {
                // no exit code
                e if e < 0 => continue,
                // error exit code
                e if e > 0 => {
                    log::debug!("Process crashed: {}", uuid);
                    removable.push((uuid.clone(), profile_id));
                }
                // 0 exit code
                _ => {
                    log::debug!("Process exited: {}", uuid);
                    removable.push((uuid.clone(), profile_id));
                }
            }
        }
        removable
    };

    // drop old processes
    if !removable.is_empty() {
        let db = app.state::<RwDatabase>();

        log::debug!("Removing old processes: {:?}", removable);

        let (process_ids, profile_ids) = removable.into_iter().unzip();

        let mut state = state.0.write().await;
        if let Err(err) = state.remove_from_cache(&db, &process_ids).await {
            log::error!("{}", err);
        }

        if let Err(err) = app.emit(
            PROCESSES_STATE_EVENT,
            ProcessStatePayload::Remove(profile_ids),
        ) {
            log::error!("{}", err);
        }
    }
}
