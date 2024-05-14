use serde::{Deserialize, Serialize};
use sha1::digest::typenum::Min;
use std::{collections::HashMap, sync::Arc};
use tokio::process::{Child, Command};
use tokio::{sync::RwLock, task::JoinHandle};
use uuid::Uuid;

use crate::errors::LauncherError;

#[derive(Debug, Serialize, Deserialize)]
pub struct ProcessCache {
    pub pid: u32,
    pub uuid: Uuid,
    pub name: String,
    pub exe: String,
    pub profile_id: String,
}

#[derive(Debug)]
pub struct Instances(HashMap<Uuid, Arc<RwLock<MinecraftInstance>>>);

impl Default for Instances {
    fn default() -> Self {
        Self::new()
    }
}

impl Instances {
    pub fn new() -> Self {
        Self(HashMap::new())
    }

    pub async fn rescue_cache(&mut self) -> Result<(), LauncherError> {
        unimplemented!()
    }

    pub async fn insert_new_process(
        &mut self,
        uuid: Uuid,
        exe: &str,
        args: Vec<String>,
    ) -> Result<Arc<RwLock<MinecraftInstance>>, LauncherError> {
        let proc = Command::new(exe).args(args).spawn()?;

        let child = InstanceType::FullChild(proc);

        /*let pid = child.id().ok_or_else(|| {
            LauncherError::Generic("Process immediately failed, could not get PID".to_string())
        })?;*/

        child.cache_process().await?;

        let current_child = Arc::new(RwLock::new(child));

        let instance = MinecraftInstance {
            uuid,
            current_child,
        };

        let i = Arc::new(RwLock::new(instance));
        self.0.insert(uuid, i.clone());

        Ok(i)
    }

    pub async fn insert_cached_process(
        &mut self,
    ) -> Result<Arc<RwLock<InstanceType>>, LauncherError> {
        unimplemented!()
    }

    pub fn get(&self, uuid: Uuid) -> Option<Arc<RwLock<MinecraftInstance>>> {
        unimplemented!()
    }

    pub fn keys(&self) -> Vec<Uuid> {
        self.0.keys().cloned().collect()
    }

    pub async fn exit_status(&self, uuid: Uuid) -> Result<Option<i32>, LauncherError> {
        unimplemented!()
    }

    pub async fn running_keys(&self) -> Result<Vec<Uuid>, LauncherError> {
        unimplemented!()
    }

    pub async fn running_keys_with_profile(&self) -> Result<Vec<Uuid>, LauncherError> {
        unimplemented!()
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
        Ok(None)
    }
    pub async fn kill(&mut self) -> Result<(), LauncherError> {
        Ok(())
    }
    pub fn id(&self) -> Option<u32> {
        None
    }

    pub async fn cache_process(&self) -> Result<(), LauncherError> {
        Ok(())
    }

    pub async fn remove_cache(&self) -> Result<(), LauncherError> {
        Ok(())
    }
}

#[derive(Debug)]
pub struct MinecraftInstance {
    pub uuid: Uuid,
    pub current_child: Arc<RwLock<InstanceType>>,
}
