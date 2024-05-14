use std::{collections::HashMap, path::PathBuf};

use serde::{Deserialize, Serialize};

use crate::errors::LauncherError;

#[derive(Debug, Serialize, Deserialize, Default)]
pub struct JavaRuntimes(HashMap<String, (String, String)>);

impl JavaRuntimes {
    pub fn new() -> Self {
        Self(HashMap::new())
    }
    pub fn get(&self, version: usize) -> Option<&String> {
        match self.0.get(&format!("JAVA_{}", version)) {
            Some((_, path)) => Some(path),
            None => None,
        }
    }
    pub fn insert(
        &mut self,
        version: usize,
        java_version: String,
        path: PathBuf,
    ) -> Result<(), LauncherError> {
        if !(path.exists() && path.is_file()) {
            return Err(LauncherError::Generic(format!(
                "Java exe path is invalid: {}",
                path.to_string_lossy()
            )));
        }

        self.0.insert(
            format!("JAVA_{}", version),
            (java_version, path.to_string_lossy().to_string()),
        );

        Ok(())
    }
}
