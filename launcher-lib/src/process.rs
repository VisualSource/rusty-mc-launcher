use log::error;
use std::{collections::HashMap, path::Path, time::Duration};
use tokio::{
    process::{Child, Command},
    task::{self},
};
use uuid::Uuid;

use crate::{
    database::RwDatabase,
    error::{Error, Result},
    launcher::logs,
};

#[derive(Default)]
pub struct Processes {
    pub state: HashMap<String, Process>,
    // profile id to process id
    ptu: HashMap<String, String>,
}

impl Processes {
    pub fn insert(&mut self, process: Process) {
        self.ptu
            .insert(process.profile_id.clone(), process.uuid.clone());
        self.state.insert(process.uuid.clone(), process);
    }
    pub fn remove(&mut self, uuid: &str) {
        if let Some(data) = self.state.remove(uuid) {
            self.ptu.remove(&data.profile_id);

            if let Some(watcher) = data.startup_watcher {
                watcher.cancel();
            }
        }
    }

    pub fn get_running(&self) -> Vec<String> {
        self.ptu.keys().cloned().collect::<Vec<String>>()
    }

    pub fn remove_list(&mut self, uuids: &Vec<&String>) {
        for uuid in uuids {
            self.remove(uuid);
        }
    }

    pub fn has(&self, uuid: &str) -> bool {
        self.state.contains_key(uuid)
    }

    pub fn get(&self, uuid: &str) -> Option<&Process> {
        self.state.get(uuid)
    }
    pub fn get_mut(&mut self, profile_id: &str) -> Option<&mut Process> {
        if let Some(uuid) = self.ptu.get(profile_id) {
            self.state.get_mut(uuid)
        } else {
            None
        }
    }

    pub async fn remove_from_cache(
        &mut self,
        rwdb: &RwDatabase,
        items: &Vec<String>,
    ) -> Result<()> {
        let db = rwdb.write().await;

        for uuid in items {
            self.remove(uuid);
            sqlx::query!("DELETE FROM processes WHERE uuid = ?", uuid)
                .execute(&db.0)
                .await?;
        }

        Ok(())
    }

    /// Loads processes from db.
    pub async fn load_cache(&mut self, rwdb: &RwDatabase) -> Result<()> {
        let db = rwdb.write().await;

        let processes: Vec<Process> = sqlx::query_as("SELECT * FROM processes;")
            .fetch_all(&db.0)
            .await?;
        // delete old processes
        sqlx::query("DELETE FROM processes;").execute(&db.0).await?;

        let system = sysinfo::System::new();
        for mut cache in processes {
            if let Some(process) = system.process(sysinfo::Pid::from_u32(cache.pid as u32)) {
                let name = process.name().to_string_lossy().to_string();
                if cache.name != name {
                    continue;
                }
                if let Some(exe) = process.exe() {
                    if cache.exe != exe.to_string_lossy() {
                        continue;
                    }
                } else {
                    continue;
                }

                self.ptu
                    .insert(cache.profile_id.clone(), cache.uuid.clone());

                cache.child = InstanceType::Partial(process.pid().as_u32());
                self.insert(cache);
            }
        }

        Ok(())
    }
    pub async fn cache(&self, dbrw: &RwDatabase) -> Result<()> {
        let db = dbrw.write().await;

        for item in self.state.values() {
            sqlx::query!(
                "INSERT INTO processes VALUES (?,?,?,?,?);",
                item.uuid,
                item.pid,
                item.name,
                item.exe,
                item.profile_id
            )
            .execute(&db.0)
            .await?;
        }

        Ok(())
    }
}

fn get_modified_time(file: &Path, now: &std::time::SystemTime) -> std::io::Result<bool> {
    let metadata = file.metadata()?;
    let modified = metadata.modified()?;

    Ok(&modified > now)
}

#[derive(Debug, sqlx::FromRow)]
pub struct Process {
    pub pid: i64,
    pub uuid: String,
    pub name: String,
    pub exe: String,
    pub profile_id: String,
    #[sqlx(skip)]
    pub child: InstanceType,
    #[sqlx(skip)]
    pub startup_watcher: Option<tokio_util::sync::CancellationToken>,
}

impl Process {
    pub async fn spawn(
        exe: String,
        args: Vec<String>,
        profile_id: String,
        game_directory: &Path,
        on_ready: tokio::sync::oneshot::Sender<String>,
        max_wait_to_start: Option<u64>,
    ) -> Result<Self> {
        let uuid = Uuid::new_v4().to_string();

        let now = std::time::SystemTime::now();

        let ps = Command::new(&exe)
            .current_dir(game_directory)
            .stdout(std::process::Stdio::piped())
            .stderr(std::process::Stdio::piped())
            .args(args)
            .spawn()?;

        // =======================
        // START: get-process-info
        // =======================

        let pid = sysinfo::Pid::from_u32(ps.id().unwrap_or_default());
        let mut system = sysinfo::System::new();

        system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

        let process = system
            .process(pid)
            .ok_or_else(|| Error::NotFound("Failed to find process".to_string()))?;
        let name = process.name().to_string_lossy().to_string();
        let Some(path) = process.exe() else {
            return Err(Error::NotFound(format!(
                "Process {} has no accessable path.",
                pid.as_u32(),
            )));
        };
        let exe_path = path.to_string_lossy().to_string();

        let child = InstanceType::Full(ps);

        // =====================
        // END: get-process-info
        // =====================

        let cancellation_token = tokio_util::sync::CancellationToken::new();

        let log_file = game_directory.join("logs/latest.log");
        let token = cancellation_token.clone();
        task::spawn(async move {
            let mut interval = tokio::time::interval(Duration::from_millis(250));
            let watched = pid;
            // default is wait about 1min
            let max_ticks = max_wait_to_start.unwrap_or(1200) + 8;
            let mut log_file_ready = false;
            let mut tick_count = 0;
            let mut cursor = 0;

            'watcher: loop {
                interval.tick().await;

                if token.is_cancelled() {
                    if let Err(err) = on_ready.send("process::exited".to_string()) {
                        log::error!("Failed to send on ready. {}", err);
                    }
                    break;
                }

                tick_count += 1;

                if !log_file_ready {
                    if log_file.exists() {
                        match get_modified_time(&log_file, &now) {
                            Ok(ready) => {
                                log_file_ready = ready;
                            }
                            Err(err) => {
                                error!("{}", err);
                                if let Err(err) = on_ready.send("error::io".to_string()) {
                                    log::error!("Failed to send on ready. {}", err);
                                }
                                break 'watcher;
                            }
                        }
                    }
                } else {
                    match logs::get_latest_log_cursor(&log_file, cursor).await {
                        Ok(result) => {
                            cursor = result.cursor;
                            for x in result.line.split('\n') {
                                if x.contains("[Render thread/INFO]: Sound engine started") {
                                    log::debug!("Game is ready!");
                                    if let Err(err) = on_ready.send("ok".to_string()) {
                                        log::error!("Failed to send on ready. {}", err);
                                    }
                                    break 'watcher;
                                }
                            }
                        }
                        Err(err) => {
                            log::error!("Launch watcher errored! {}", err);
                            if let Err(err) = on_ready.send("error::io".to_string()) {
                                log::error!("Failed to send on ready. {}", err);
                            }
                            break 'watcher;
                        }
                    }
                }

                if tick_count >= max_ticks {
                    let mut system = sysinfo::System::new();
                    system.refresh_processes(sysinfo::ProcessesToUpdate::All, true);

                    if let Some(process) = system.process(watched) {
                        process.kill();
                    }

                    log::debug!("Game failed to launch killing.");

                    if let Err(err) = on_ready.send("error::timeout".to_string()) {
                        log::error!("Failed to send on ready. {}", err);
                    }

                    break 'watcher;
                }
            }
        });

        Ok(Self {
            pid: pid.as_u32() as i64,
            uuid,
            name,
            exe: exe_path,
            profile_id,
            child,
            startup_watcher: Some(cancellation_token),
        })
    }
    pub async fn status(&mut self) -> Result<Option<i32>> {
        match &mut self.child {
            InstanceType::Unknown => Ok(None),
            InstanceType::Full(child) => {
                Ok(child.try_wait()?.map(|x| x.code().unwrap_or_default()))
            }
            InstanceType::Partial(pid) => {
                let mut system = sysinfo::System::new();
                let id = sysinfo::Pid::from_u32(*pid);
                if system.refresh_processes(sysinfo::ProcessesToUpdate::Some(&[id]), true) == 0 {
                    return Ok(Some(0));
                }

                if let Some(process) = system.process(id) {
                    if process.status() == sysinfo::ProcessStatus::Run {
                        Ok(None)
                    } else {
                        Ok(Some(0))
                    }
                } else {
                    Ok(Some(0))
                }
            }
        }
    }
    pub async fn kill(&mut self) -> Result<()> {
        if let Some(watcher) = &self.startup_watcher {
            watcher.cancel();
        }

        match &mut self.child {
            InstanceType::Unknown => Err(Error::Generic("No active instance".to_string())),
            InstanceType::Full(child) => Ok(child.kill().await?),
            InstanceType::Partial(pid) => {
                let mut system = sysinfo::System::new();
                let id = sysinfo::Pid::from_u32(*pid);
                if system.refresh_processes(sysinfo::ProcessesToUpdate::Some(&[id]), true) == 1 {
                    if let Some(process) = system.process(id) {
                        process.kill();
                    }
                }
                Ok(())
            }
        }
    }
    pub fn pid(&self) -> Option<u32> {
        match &self.child {
            InstanceType::Unknown => None,
            InstanceType::Full(child) => child.id(),
            InstanceType::Partial(pid) => Some(*pid),
        }
    }
}

#[derive(Debug)]
pub enum InstanceType {
    Unknown,
    Full(Child),
    Partial(u32),
}

impl Default for InstanceType {
    fn default() -> Self {
        Self::Unknown
    }
}
