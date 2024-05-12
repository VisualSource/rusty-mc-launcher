use std::{collections::HashMap, path::PathBuf};

use serde::{Deserialize, Serialize};

use crate::errors::LauncherError;

#[derive(Debug, Deserialize, Serialize, Default)]
pub struct AppState {
    java: HashMap<String, String>,
}

impl AppState {
    pub fn get_java(&self, version: usize) -> Option<&String> {
        self.java.get(&format!("JAVA_{}", version))
    }
    pub fn insert_java(&mut self, version: usize, path: PathBuf) -> Result<(), LauncherError> {
        if !(path.exists() && path.is_file()) {
            return Err(LauncherError::Generic(format!(
                "Java exe path is invalid: {}",
                path.to_string_lossy()
            )));
        }

        self.java.insert(
            format!("JAVA_{}", version),
            path.to_string_lossy().to_string(),
        );

        Ok(())
    }
}
