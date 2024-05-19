use serde::{Deserialize, Serialize};
use serde_json::json;
use std::str::FromStr;
use std::{collections::HashMap, sync::Arc};
use tokio::process::{Child, Command};
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::errors::LauncherError;
use crate::AppState;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessCache {
    pub pid: u32,
    pub uuid: Uuid,
    pub name: String,
    pub exe: String,
    pub profile_id: Uuid,
}

impl TryFrom<HashMap<String, serde_json::Value>> for ProcessCache {
    type Error = LauncherError;

    fn try_from(value: HashMap<String, serde_json::Value>) -> Result<Self, Self::Error> {
        let pid = value
            .get("pid")
            .ok_or(LauncherError::NotFound("Failed to get pid".to_string()))?
            .as_u64()
            .ok_or(LauncherError::Generic(
                "Failed to convernt to u64".to_string(),
            ))? as u32;
        let uuid = value
            .get("uuid")
            .ok_or_else(|| LauncherError::NotFound("Failed to get pid".to_string()))?
            .as_str()
            .ok_or_else(|| LauncherError::Generic("Failed to convernt to u64".to_string()))?;

        let uuid = Uuid::from_str(uuid)
            .map_err(|e| LauncherError::Generic(format!("Failed to contruct uuid: {}", e)))?;

        let name = value
            .get("name")
            .ok_or_else(|| LauncherError::NotFound("Failed to get name".to_string()))?
            .as_str()
            .ok_or_else(|| LauncherError::Generic("Failed to convernt to str".to_string()))?
            .to_string();

        let exe = value
            .get("exe")
            .ok_or_else(|| LauncherError::NotFound("Failed to get exe".to_string()))?
            .as_str()
            .ok_or_else(|| LauncherError::Generic("Failed to convernt to str".to_string()))?
            .to_string();

        let profile = value
            .get("profile")
            .ok_or_else(|| LauncherError::NotFound("Failed to get profile".to_string()))?
            .as_str()
            .ok_or_else(|| LauncherError::Generic("Failed to convernt to profile".to_string()))?;

        let profile = Uuid::from_str(profile)
            .map_err(|e| LauncherError::Generic(format!("Failed to contruct uuid: {}", e)))?;

        Ok(Self {
            pid,
            uuid,
            name,
            exe,
            profile_id: profile,
        })
    }
}

#[derive(Debug)]
pub struct Instances(RwLock<HashMap<Uuid, Arc<RwLock<MinecraftInstance>>>>);

impl Default for Instances {
    fn default() -> Self {
        Self::new()
    }
}

impl Instances {
    pub fn new() -> Self {
        Self(RwLock::new(HashMap::new()))
    }

    pub async fn rescue_cache(&mut self, app: &AppState) -> Result<(), LauncherError> {
        let processes = app.select("SELECT * FROM processes;", Vec::new()).await?;
        app.execute("DELETE FROM processes;").await?;

        for process in processes {
            match ProcessCache::try_from(process) {
                Ok(cache) => {
                    let uuid = cache.uuid.to_owned();
                    if let Err(err) = self.insert_cached_process(app, cache).await {
                        log::warn!("Failed to rescue cached process {}: {}", uuid, err);
                    }
                }
                Err(error) => log::warn!(
                    "Failed to resuce cached process (Row was malformed): {}",
                    error
                ),
            }
        }

        Ok(())
    }

    pub async fn insert_new_process(
        &self,
        app: &AppState,
        uuid: Uuid,
        profile_id: Uuid,
        exe: &str,
        args: Vec<String>,
    ) -> Result<Arc<RwLock<MinecraftInstance>>, LauncherError> {
        let proc = Command::new(exe).args(args).spawn()?;

        let child = InstanceType::FullChild(proc);

        child.cache_process(app, uuid, profile_id).await?;

        let current_child = Arc::new(RwLock::new(child));

        let instance = MinecraftInstance {
            uuid,
            current_child,
            profile: profile_id,
        };

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
            .process(sysinfo::Pid::from_u32(cache.pid))
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

        let child = InstanceType::ResucedPID(cache.pid);

        child
            .cache_process(app, cache.uuid, cache.profile_id)
            .await?;

        let current_child = Arc::new(RwLock::new(child));

        let mchild = MinecraftInstance::new(cache.uuid, cache.profile_id, current_child);

        let mchild = Arc::new(RwLock::new(mchild));
        self.0.write().await.insert(cache.uuid, mchild.clone());

        Ok(mchild)
    }

    pub async fn get(&self, uuid: &Uuid) -> Option<Arc<RwLock<MinecraftInstance>>> {
        self.0.read().await.get(uuid).cloned()
    }

    pub async fn keys(&self) -> Vec<Uuid> {
        self.0.read().await.keys().cloned().collect()
    }

    pub async fn exit_status(&self, uuid: &Uuid) -> Result<Option<i32>, LauncherError> {
        if let Some(child) = self.get(uuid).await {
            let child = child.write().await;
            let status = child.current_child.write().await.try_wait().await?;
            Ok(status)
        } else {
            Ok(None)
        }
    }

    pub async fn running_keys(&self) -> Result<Vec<Uuid>, LauncherError> {
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

    pub async fn running_keys_with_profile(
        &self,
        profile: &Uuid,
    ) -> Result<Vec<Uuid>, LauncherError> {
        let runnings_keys = self.running_keys().await?;

        let mut keys = Vec::new();

        for key in runnings_keys {
            if let Some(child) = self.get(&key).await {
                let child = child.clone();
                let child = child.read().await;
                if &child.profile == profile {
                    keys.push(key)
                }
            }
        }
        Ok(keys)
    }

    pub async fn running_profiles(&self) -> Result<Vec<i32>, LauncherError> {
        unimplemented!()
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
        uuid: uuid::Uuid,
        profile_id: uuid::Uuid,
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

        app.execute_with(
            "INSERT INTO processes VALUES (?,?,?,?,?)",
            json!([uuid, name, pid, exe, profile_id])
                .as_array()
                .ok_or(LauncherError::Generic("Failed to make array".to_string()))?,
        )
        .await?;

        Ok(())
    }

    pub async fn remove_cache(
        &self,
        app: &AppState,
        process_uuid: uuid::Uuid,
    ) -> Result<(), LauncherError> {
        app.execute_with(
            "DELETE FROM processes WHERE id = ?",
            json!([process_uuid])
                .as_array()
                .ok_or(LauncherError::Generic("Failed to make array".to_string()))?,
        )
        .await?;

        Ok(())
    }
}

#[derive(Debug)]
pub struct MinecraftInstance {
    pub uuid: Uuid,
    pub current_child: Arc<RwLock<InstanceType>>,
    pub profile: Uuid,
}

impl MinecraftInstance {
    pub fn new(uuid: Uuid, profile: Uuid, current: Arc<RwLock<InstanceType>>) -> Self {
        Self {
            uuid,
            profile,
            current_child: current,
        }
    }
}
