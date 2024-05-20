use serde::{Deserialize, Serialize};
use std::{collections::HashMap, sync::Arc};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::errors::LauncherError;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessCache {
    pub pid: i64,
    pub uuid: String,
    pub name: String,
    pub exe: String,
    pub profile_id: String,
}

impl ProcessCache {
    pub fn get_pid(&self) -> u32 {
        self.pid as u32
    }
}

#[derive(Debug)]
pub struct Instances(RwLock<HashMap<String, Arc<RwLock<MinecraftInstance>>>>);

impl Default for Instances {
    fn default() -> Self {
        Self::new()
    }
}

impl Instances {
    pub fn new() -> Self {
        Self(RwLock::new(HashMap::new()))
    }

    pub async fn stop_process(&self, app: &AppState, uuid: String) -> Result<(), LauncherError> {
        if let Some(process) = self.get(&uuid).await {
            let a = process.write().await;
            let mut instance = a.current_child.write().await;

            instance.kill().await?;
            instance.remove_cache(app, &uuid).await?;

            self.0.write().await.remove(&uuid);
        }

        Ok(())
    }

    pub async fn rescue_cache(&mut self, app: &AppState) -> Result<(), LauncherError> {
        let processes: Vec<ProcessCache> = sqlx::query_as!(ProcessCache, "SELECT * FROM processes")
            .fetch_all(&app.database.0)
            .await?;
        sqlx::query("DELETE FROM processes")
            .execute(&app.database.0)
            .await?;

        for process in processes {
            let uuid = process.uuid.to_owned();
            if let Err(err) = self.insert_cached_process(app, process).await {
                log::warn!("Failed to rescue cached process {}: {}", uuid, err);
            }
        }

        Ok(())
    }

    pub async fn insert_new_process(
        &self,
        app: &AppState,
        profile_id: String,
        exe: &str,
        args: Vec<String>,
    ) -> Result<Arc<RwLock<MinecraftInstance>>, LauncherError> {
        let uuid = Uuid::new_v4().to_string();
        let proc = Command::new(exe).args(args).spawn()?;

        let child = InstanceType::FullChild(proc);

        child.cache_process(app, &uuid, &profile_id).await?;

        let current_child = Arc::new(RwLock::new(child));

        let instance = MinecraftInstance::new(uuid.to_owned(), profile_id, current_child);

        let i = Arc::new(RwLock::new(instance));
        self.0.write().await.insert(uuid, i.clone());

        Ok(i)
    }

    pub async fn insert_cached_process(
        &mut self,
        app: &AppState,
        cache: ProcessCache,
    ) -> Result<Arc<RwLock<MinecraftInstance>>, LauncherError> {
        let system = sysinfo::System::new();
        let process = system
            .process(sysinfo::Pid::from_u32(cache.get_pid()))
            .ok_or_else(|| {
                LauncherError::NotFound(format!("Could not find proccess {}", cache.pid))
            })?;

        if cache.name != process.name() {
            return Err(LauncherError::Generic(format!(
                "Cached process {} has different name than actual process {}",
                cache.pid,
                process.name()
            )));
        }

        if let Some(path) = process.exe() {
            if cache.exe != path.to_string_lossy() {
                return Err(LauncherError::Generic(format!(
                    "Cached process {} has different exe than actual process {}",
                    cache.pid,
                    path.to_string_lossy()
                )));
            }
        } else {
            return Err(LauncherError::Generic(format!(
                "Cached process {} has no accessable path",
                cache.pid
            )));
        }

        let child = InstanceType::ResucedPID(cache.get_pid());

        child
            .cache_process(app, &cache.uuid, &cache.profile_id)
            .await?;

        let current_child = Arc::new(RwLock::new(child));

        let mchild = MinecraftInstance::new(cache.uuid.to_owned(), cache.profile_id, current_child);

        let mchild = Arc::new(RwLock::new(mchild));
        self.0.write().await.insert(cache.uuid, mchild.clone());

        Ok(mchild)
    }

    pub async fn get(&self, uuid: &str) -> Option<Arc<RwLock<MinecraftInstance>>> {
        self.0.read().await.get(uuid).cloned()
    }

    pub async fn keys(&self) -> Vec<String> {
        self.0.read().await.keys().cloned().collect()
    }

    pub async fn exit_status(&self, uuid: &str) -> Result<Option<i32>, LauncherError> {
        if let Some(child) = self.get(uuid).await {
            let child = child.write().await;
            let status = child.current_child.write().await.try_wait().await?;
            Ok(status)
        } else {
            Ok(None)
        }
    }

    pub async fn running_keys(&self) -> Result<Vec<String>, LauncherError> {
        let mut keys = Vec::new();

        for key in self.keys().await {
            if let Some(child) = self.get(&key).await {
                let child = child.clone();
                let child = child.write().await;
                if child
                    .current_child
                    .write()
                    .await
                    .try_wait()
                    .await?
                    .is_none()
                {
                    keys.push(key)
                }
            }
        }
        Ok(keys)
    }

    /// Gets all PID keys of running children with a given profile path
    pub async fn running_keys_with_profile(
        &self,
        profile: &str,
    ) -> Result<Vec<String>, LauncherError> {
        let runnings_keys = self.running_keys().await?;

        let mut keys = Vec::new();

        for key in runnings_keys {
            if let Some(child) = self.get(&key).await {
                let child = child.clone();
                let child = child.read().await;
                if child.profile == profile {
                    keys.push(key)
                }
            }
        }
        Ok(keys)
    }

    pub async fn running_profiles_ids(&self) -> Result<Vec<String>, LauncherError> {
        let mut profiles = Vec::new();
        for key in self.keys().await {
            if let Some(child) = self.get(&key).await {
                let child = child.clone();
                let child = child.write().await;
                if child
                    .current_child
                    .write()
                    .await
                    .try_wait()
                    .await?
                    .is_none()
                {
                    profiles.push(child.profile.to_owned());
                }
            }
        }

        Ok(profiles)
    }
}

#[derive(Debug)]
pub enum InstanceType {
    FullChild(Child),
    ResucedPID(u32),
}

impl InstanceType {
    pub async fn try_wait(&mut self) -> Result<Option<i32>, LauncherError> {
        match self {
            InstanceType::FullChild(child) => Ok(child.try_wait()?.map(|x| x.code().unwrap_or(0))),
            InstanceType::ResucedPID(pid) => {
                let mut system = sysinfo::System::new();
                let id = sysinfo::Pid::from_u32(*pid);
                if !system.refresh_process(id) {
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
    pub async fn kill(&mut self) -> Result<(), LauncherError> {
        match self {
            InstanceType::FullChild(child) => Ok(child.kill().await?),
            InstanceType::ResucedPID(pid) => {
                let mut system = sysinfo::System::new();
                let id = sysinfo::Pid::from_u32(*pid);
                if system.refresh_process(id) {
                    if let Some(process) = system.process(id) {
                        process.kill();
                    }
                }
                Ok(())
            }
        }
    }
    pub fn id(&self) -> Option<u32> {
        match self {
            InstanceType::FullChild(child) => child.id(),
            InstanceType::ResucedPID(pid) => Some(*pid),
        }
    }

    pub async fn cache_process(
        &self,
        app: &AppState,
        uuid: &str,
        profile_id: &str,
    ) -> Result<(), LauncherError> {
        let pid = self.id().unwrap_or(0);

        let mut system = sysinfo::System::new();
        system.refresh_processes();

        let process = system
            .process(sysinfo::Pid::from_u32(pid))
            .ok_or_else(|| LauncherError::NotFound(format!("Could not find processes {}", pid)))?;
        let name = process.name().to_string();
        let Some(path) = process.exe() else {
            return Err(LauncherError::Generic(format!(
                "Cached process {} has no accessable path",
                pid
            ))
            .into());
        };
        let exe = path.to_string_lossy().to_string();

        let mut query = sqlx::query("INSERT INTO processes VALUES (?,?,?,?,?)");
        query = query
            .bind(uuid)
            .bind(pid)
            .bind(name)
            .bind(exe)
            .bind(profile_id);

        query.execute(&app.database.0).await?;

        Ok(())
    }

    pub async fn remove_cache(
        &self,
        app: &AppState,
        process_uuid: &str,
    ) -> Result<(), LauncherError> {
        let query = sqlx::query("DELETE FROM processes WHERE id = ?").bind(process_uuid);
        query.execute(&app.database.0).await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct MinecraftInstance {
    pub uuid: String,
    pub current_child: Arc<RwLock<InstanceType>>,
    pub profile: String,
}

impl MinecraftInstance {
    pub fn new(uuid: String, profile: String, current: Arc<RwLock<InstanceType>>) -> Self {
        Self {
            uuid,
            profile,
            current_child: current,
        }
    }
}
