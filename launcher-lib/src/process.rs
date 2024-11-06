use std::{collections::HashMap, path::Path};
use tokio::process::{Child, Command};
use uuid::Uuid;

use crate::error::{Error, Result};

#[derive(Default)]
pub struct Processes(HashMap<String, Process>);

impl Processes {
    pub fn insert(&mut self, process: Process) {
        self.0.insert(process.uuid.clone(), process);
    }
    pub fn remove(&mut self, uuid: &str) {
        self.0.remove(uuid);
    }
    pub fn has(&self, uuid: &str) -> bool {
        self.0.contains_key(uuid)
    }

    pub fn get(&self, uuid: &str) -> Option<&Process> {
        self.0.get(uuid)
    }
    pub fn get_mut(&mut self, uuid: &str) -> Option<&mut Process> {
        self.0.get_mut(uuid)
    }

    pub async fn is_running(&mut self, uuid: &str) -> Result<bool> {
        if let Some(process) = self.0.get_mut(uuid) {
            return Ok(process.try_wait().await?.is_none());
        }
        Ok(false)
    }
    pub async fn load_cache(&mut self, db: &crate::database::Database) -> Result<()> {
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

                cache.child = InstanceType::Partial(process.pid().as_u32());
                self.insert(cache);
            }
        }

        Ok(())
    }
    pub async fn cache(&self, db: &crate::database::Database) -> Result<()> {
        for item in self.0.values() {
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

#[derive(Debug, sqlx::FromRow)]
pub struct Process {
    pub pid: i64,
    pub uuid: String,
    pub name: String,
    pub exe: String,
    pub profile_id: String,
    #[sqlx(skip)]
    pub child: InstanceType,
}

impl Process {
    pub async fn spawn(
        exe: String,
        args: Vec<String>,
        profile_id: String,
        game_directory: &Path,
    ) -> Result<Self> {
        let uuid = Uuid::new_v4().to_string();

        let ps = Command::new(&exe)
            .current_dir(game_directory)
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

        Ok(Self {
            pid: pid.as_u32() as i64,
            uuid,
            name,
            exe: exe_path,
            profile_id,
            child,
        })
    }
    pub async fn try_wait(&mut self) -> Result<Option<i32>> {
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
