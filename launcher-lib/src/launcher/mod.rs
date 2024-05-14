pub mod arguments;
mod state;
use self::arguments::Arguments;
use crate::state::AppState;
use crate::{errors::LauncherError, manifest::Manifest};
use normalize_path::NormalizePath;
use serde::Deserialize;
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Deserialize)]
pub struct LaunchConfig {
    runtime_directory: PathBuf,
    game_directory: PathBuf,
    version: String,
    auth_player_name: String,
    auth_uuid: String,
    auth_access_token: String,
    auth_xuid: String,

    #[serde(default)]
    demo: bool,

    additonal_java_arguments: Option<Vec<String>>,

    resolution_width: Option<String>,
    resolution_height: Option<String>,
    quick_play_path: Option<String>,
    quick_play_single_player: Option<String>,
    quick_play_realms: Option<String>,
    quick_play_multiplayer: Option<String>,
}
#[derive(Debug)]
pub struct Config {
    // magic uuid
    clientid: String,
    user_type: String,

    // required props
    //runtime_directory: PathBuf,
    //version: String,
    auth_player_name: String,
    auth_uuid: String,
    auth_access_token: String,
    auth_xuid: String,

    game_directory: String,

    // computaed values
    classpath: String,
    version_type: String,
    version_name: String,
    assets_index_name: String,
    natives_directory: String,
    assets_root: String,

    // optinal config
    launcher_name: String,
    launcher_version: String,

    demo: bool,

    additonal_java_arguments: Option<Vec<String>>,

    resolution_width: Option<String>,
    resolution_height: Option<String>,
    quick_play_path: Option<String>,
    quick_play_single_player: Option<String>,
    quick_play_realms: Option<String>,
    quick_play_multiplayer: Option<String>,
}

impl Config {
    pub async fn from(launch_config: LaunchConfig) -> Result<(Self, Manifest), LauncherError> {
        let assets_root = launch_config.runtime_directory.join("assets").normalize();
        if !assets_root.exists() || !assets_root.is_dir() {
            return Err(LauncherError::NotFound(format!(
                "Assets root was not found: ({})",
                assets_root.to_string_lossy()
            )));
        }

        let natives_directory = launch_config
            .runtime_directory
            .join("natives")
            .join(&launch_config.version)
            .normalize();

        if !natives_directory.exists() || !natives_directory.is_dir() {
            fs::create_dir_all(&natives_directory).await?;
        }

        let manifest_directory = launch_config
            .runtime_directory
            .join("versions")
            .join(&launch_config.version)
            .join(format!("{}.json", &launch_config.version))
            .normalize();
        if !manifest_directory.exists() || !manifest_directory.is_file() {
            return Err(LauncherError::NotFound(format!(
                "Manifest directory was not found: ({})",
                manifest_directory.to_string_lossy()
            )));
        }

        let manifest = Manifest::read_manifest(&manifest_directory, true).await?;

        let classpath =
            manifest.libs_as_string(&launch_config.runtime_directory, &launch_config.version)?;

        Ok((
            Self {
                auth_player_name: launch_config.auth_player_name,
                auth_access_token: launch_config.auth_access_token,
                auth_uuid: launch_config.auth_uuid,
                auth_xuid: launch_config.auth_xuid,
                version_name: manifest.id.to_owned(),
                version_type: manifest.release_type.to_owned(),
                demo: launch_config.demo,
                launcher_name: "mcrl".to_string(),
                launcher_version: env!("CARGO_PKG_VERSION").to_string(),
                assets_index_name: manifest
                    .assets
                    .as_ref()
                    .ok_or(LauncherError::NotFound(
                        "Failed to get assets index".to_string(),
                    ))?
                    .to_owned(),
                resolution_height: launch_config.resolution_height,
                resolution_width: launch_config.resolution_width,
                classpath,
                clientid: "c4502edb-87c6-40cb-b595-64a280cf8906".to_string(),
                user_type: "msa".to_string(),
                assets_root: assets_root.to_string_lossy().to_string(),
                game_directory: launch_config
                    .runtime_directory
                    .to_string_lossy()
                    .to_string(),
                additonal_java_arguments: launch_config.additonal_java_arguments,
                natives_directory: natives_directory.to_string_lossy().to_string(),
                quick_play_multiplayer: launch_config.quick_play_multiplayer,
                quick_play_path: launch_config.quick_play_path,
                quick_play_realms: launch_config.quick_play_realms,
                quick_play_single_player: launch_config.quick_play_single_player,
            },
            manifest,
        ))
    }
    pub fn has_custom_resolution(&self) -> Option<bool> {
        Some(self.resolution_height.is_some() || self.resolution_width.is_some())
    }
    pub fn is_quick_play_realms(&self) -> Option<bool> {
        if self.quick_play_realms.is_none() {
            None
        } else {
            Some(true)
        }
    }
    pub fn is_quick_play_multiplayer(&self) -> Option<bool> {
        Some(self.quick_play_multiplayer.is_some())
    }
    pub fn is_quick_play_singleplayer(&self) -> Option<bool> {
        Some(self.quick_play_single_player.is_some())
    }
    pub fn has_quick_plays_support(&self) -> Option<bool> {
        Some(self.quick_play_path.is_some())
    }
    pub fn is_demo_user(&self) -> Option<bool> {
        Some(self.demo)
    }

    pub fn get_replacement(&self, key: &str) -> Option<&String> {
        match key {
            "launcher_name" => Some(&self.launcher_name),
            "launcher_version" => Some(&self.launcher_version),

            "resolution_width" => self.resolution_width.as_ref(),
            "resolution_height" => self.resolution_height.as_ref(),
            "quickPlayPath" => self.quick_play_path.as_ref(),
            "quickPlaySingleplayer" => self.quick_play_single_player.as_ref(),
            "quickPlayMultiplayer" => self.quick_play_multiplayer.as_ref(),
            "quickPlayRealms" => self.quick_play_realms.as_ref(),

            "auth_player_name" => Some(&self.auth_player_name),
            "auth_access_token" => Some(&self.auth_access_token),
            "auth_uuid" => Some(&self.auth_uuid),
            "auth_xuid" => Some(&self.auth_xuid),

            "classpath" => Some(&self.classpath),
            "version_name" => Some(&self.version_name),
            "version_type" => Some(&self.version_type),

            "assets_index_name" => Some(&self.assets_index_name),

            "natives_directory" => Some(&self.natives_directory),
            "game_directory" => Some(&self.game_directory),
            "assets_root" => Some(&self.assets_root),

            "clientid" => Some(&self.clientid),
            "user_type" => Some(&self.user_type),
            _ => None,
        }
    }
}

pub async fn start_game(
    launch_config: LaunchConfig,
    system_config: &AppState,
) -> Result<(), LauncherError> {
    let (config, manifest) = Config::from(launch_config).await?;

    let game_args = Arguments::parse_args(&manifest.arguments.game, &config);
    let jvm_args = Arguments::parse_args(&manifest.arguments.jvm, &config);

    // exec_path + jvmArgs+ (client jvm args) + logging + mainClass + gameFlags + ?(extraFlags)
    let java_version = manifest.java_version.ok_or(LauncherError::NotFound(
        "Failed to get java runtime.".to_string(),
    ))?;

    let java_store = system_config.java.read().await;

    let java_exe = java_store
        .get(java_version.major_version)
        .ok_or(LauncherError::NotFound("Java was not found".to_string()))?;

    let mut args = vec![];
    args.extend(jvm_args);
    if let Some(additonal_java_arguments) = &config.additonal_java_arguments {
        args.extend(additonal_java_arguments.to_owned());
    }

    args.push(manifest.main_class);
    args.extend(game_args);

    system_config
        .instances
        .write()
        .await
        .insert_new_process(uuid::Uuid::new_v4(), java_exe, args)
        .await;

    Ok(())
}
#[cfg(test)]
mod tests {
    use super::*;
    #[tokio::test]
    async fn test_start() {
        let runtime_directory = std::env::temp_dir().join("runtime");
        let game_directory = std::env::temp_dir().join("profiles/g");
        let java = runtime_directory
            .join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe")
            .normalize();
        let settings = LaunchConfig {
            runtime_directory,
            game_directory,
            version: "1.20.6".to_string(),
            auth_player_name: "VisaulSource".to_string(),
            auth_uuid: "37f0c4ef71c943e2baafd547302f0c92".to_string(),
            auth_access_token: "eyJraWQiOiJhYzg0YSIsImFsZyI6IkhTMjU2In0.eyJ4dWlkIjoiMjUzNTQ0MjQ2MjQ1MTk1NCIsImFnZyI6IkFkdWx0Iiwic3ViIjoiZTA2YjU1Y2QtN2FlZi00MDIzLThlNjYtZDM2YmU3ZTZjMjhhIiwiYXV0aCI6IlhCT1giLCJucyI6ImRlZmF1bHQiLCJyb2xlcyI6W10sImlzcyI6ImF1dGhlbnRpY2F0aW9uIiwiZmxhZ3MiOlsidHdvZmFjdG9yYXV0aCIsIm1zYW1pZ3JhdGlvbl9zdGFnZTQiLCJvcmRlcnNfMjAyMiIsIm11bHRpcGxheWVyIl0sInByb2ZpbGVzIjp7Im1jIjoiMzdmMGM0ZWYtNzFjOS00M2UyLWJhYWYtZDU0NzMwMmYwYzkyIn0sInBsYXRmb3JtIjoiUENfTEFVTkNIRVIiLCJ5dWlkIjoiNmNmMDAyODlkOGEwNDNhMjg2M2ZmMGRmZjNjYjhlNTIiLCJuYmYiOjE3MTU1NjEzNDQsImV4cCI6MTcxNTY0Nzc0NCwiaWF0IjoxNzE1NTYxMzQ0fQ.kFw6wFuIwNP96laDa9o6i2cRGUiGBUyd92acCPxzITA".to_string(),
            auth_xuid: "0".to_string(),

            demo: false,

            additonal_java_arguments: Some(vec!["-Xmx2048M".to_string()]),

            resolution_width: None,
            resolution_height: None,
            quick_play_path: None,
            quick_play_single_player: None,
            quick_play_realms: None,
            quick_play_multiplayer: None,
        };

        let mut system = AppState::default();
        let j = system.java.write().await;
        j.insert(21, "1.21".to_string(), java)
            .expect("Failed to insert");

        start_game(settings, &system)
            .await
            .expect("Failed to build string");
    }
}
