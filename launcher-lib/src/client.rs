use crate::utils;
use log::{debug, error, warn};
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};
use std::os::windows;
use std::{env::consts, path::PathBuf};
use tokio::fs;
use tokio::process::{Child, Command};

use crate::errors::LauncherLibError;
use crate::manifest::Manifest;
//https://github.com/tomsik68/mclauncher-api/wiki

// 1. Auth
// 2. check/install
// 3. build exec cmd
// 4. run

#[derive(Debug, Serialize)]
pub enum GameProcessStatus {
    NotRunning,
    Running,
    Exited(i32),
}

#[derive(Default, Debug)]
pub struct Client {
    cmd: String,
    args: Vec<String>,
    game_dir: PathBuf,
    process: Option<Child>,
}

impl Client {
    fn new(cmd: String, args: Vec<String>, game_dir: PathBuf) -> Self {
        Self {
            game_dir,
            cmd,
            args,
            process: None,
        }
    }

    pub fn is_running(&mut self) -> Result<GameProcessStatus, LauncherLibError> {
        if let Some(pid) = self.process.as_mut() {
            if let Some(exit_status) = pid.try_wait()? {
                self.process = None;

                let code = exit_status.code().unwrap_or_default();

                return Ok(GameProcessStatus::Exited(code));
            }

            return Ok(GameProcessStatus::Running);
        }

        Ok(GameProcessStatus::NotRunning)
    }

    pub async fn stop(&mut self) -> Result<(), LauncherLibError> {
        if let Some(pid) = self.process.as_mut() {
            pid.wait().await?;
        }

        Ok(())
    }
    pub async fn run(mut self) -> Result<Self, LauncherLibError> {
        if self.process.is_some() {
            return Err(LauncherLibError::Generic(
                "An instance of minecraft is already running".to_string(),
            ));
        }

        log::info!("Starting Game");

        debug!("{:#?}", self);

        let pid = Command::new(&self.cmd)
            .args(&self.args)
            .current_dir(&self.game_dir)
            .spawn()?;

        self.process = Some(pid);

        Ok(self)
    }
}

#[derive(Default, Serialize, Deserialize, Debug)]
pub struct ClientBuilder {
    pub profile_id: Option<String>,
    pub launcher_name: Option<String>,
    pub laucher_version: Option<String>,
    pub classpath: Option<String>,
    pub assets: Option<String>,
    pub version_type: Option<String>,
    pub console: bool,
    pub classpath_separator: Option<String>,
    pub game_directory: Option<PathBuf>,
    pub version: String,
    pub token: String,
    pub uuid: String,
    pub xuid: String,
    pub username: String,
    pub executable_path: Option<PathBuf>,
    pub jvm_args: Option<Vec<String>>,
    pub use_custom_resolution: bool,
    pub is_demo: bool,
    pub resolution_width: Option<usize>,
    pub resolution_height: Option<usize>,
    pub server: Option<String>,
    pub port: Option<usize>,
    pub natives_directory: Option<PathBuf>,
    pub enable_logging_config: bool,
    pub disable_mulitplayer: bool,
    pub disable_chat: bool,
    pub forge: Option<String>,
    pub fabric: Option<String>,
    pub client_id: Option<String>,
}

impl ClientBuilder {
    pub fn new() -> Self {
        Self::default()
    }

    pub fn get_minecraft_dir() -> Result<PathBuf, LauncherLibError> {
        match consts::OS {
            "windows" => {
                let appdata = std::env::var("APPDATA")?;
                Ok(PathBuf::from(appdata).join(".minecraft").normalize())
            }
            _ => {
                return Err(LauncherLibError::Generic(
                    "Game Directory is not set.".to_string(),
                ));
            }
        }
    }

    pub async fn check_install(
        version: String,
        game_dir: Option<PathBuf>,
    ) -> Result<bool, LauncherLibError> {
        let root = if let Some(dir) = game_dir {
            dir
        } else {
            ClientBuilder::get_minecraft_dir()?
        };
        let version_root = root.join(format!("versions/{}", version.clone()));
        let client_jar = version_root
            .join(format!("{}.jar", version.clone()))
            .normalize();
        let client_json = version_root
            .join(format!("{}.json", version.clone()))
            .normalize();

        Ok(client_jar.is_file() && client_json.is_file())
    }

    pub fn as_demo(mut self, value: bool) -> Self {
        self.is_demo = value;
        self
    }

    pub fn set_version(mut self, version: String) -> Self {
        // Forge Version string => 1.18.2-forge-40.1.51
        // Fabric Version string => fabric-loader-0.14.8-1.18.2
        self.fabric = None;
        self.forge = None;
        self.version = version;
        self
    }

    pub fn set_game_directory(mut self, dir: PathBuf) -> Self {
        self.game_directory = Some(dir);
        self
    }

    pub fn set_user(mut self, username: String, uuid: String, xuid: String, token: String) -> Self {
        self.uuid = uuid;
        self.xuid = xuid;
        self.token = token;
        self.username = username;
        self
    }

    pub fn set_executable_path(mut self, dir: PathBuf) -> Self {
        self.executable_path = Some(dir);
        self
    }

    pub fn set_jvm_args(mut self, args: Vec<String>) -> Self {
        self.jvm_args = Some(args);
        self
    }

    pub fn use_console(mut self, value: bool) -> Self {
        self.console = value;
        self
    }

    pub fn set_custom_resolution(mut self, width: usize, height: usize) -> Self {
        self.use_custom_resolution = true;
        self.resolution_height = Some(height);
        self.resolution_width = Some(width);
        self
    }

    pub fn set_startup_server(mut self, server: String, port: usize) -> Self {
        self.server = Some(server);
        self.port = Some(port);
        self
    }

    pub fn set_natives_directory(mut self, dir: PathBuf) -> Self {
        self.natives_directory = Some(dir.normalize());
        self
    }

    pub fn set_enable_logging_config(mut self, value: bool) -> Self {
        self.enable_logging_config = value;
        self
    }
    pub fn set_disable_mulitplayer(mut self, value: bool) -> Self {
        self.disable_mulitplayer = value;
        self
    }
    pub fn set_disable_chat(mut self, value: bool) -> Self {
        self.disable_chat = value;
        self
    }

    pub async fn build(mut self) -> Result<Client, LauncherLibError> {
        debug!("Get Game dir");

        let game_dir = if self.game_directory.is_some() {
            self.game_directory
                .to_owned()
                .ok_or(LauncherLibError::NotFound(
                    "No Game Directory was set".to_string(),
                ))?
        } else {
            let dir = ClientBuilder::get_minecraft_dir()?;

            self.game_directory = Some(dir.clone());

            dir
        };

        // exec_path + jvmArgs+ (client jvm args) + logging + mainClass + gameFlags + ?(extraFlags)
        // fabric / forge check

        debug!("Get manifest");
        let path = game_dir.join(format!("versions/{0}/{0}.json", self.version));
        let manifest = Manifest::read_manifest(&path, true).await?;

        self.assets = manifest.assets.clone();
        self.version_type = Some(manifest.type_field.clone());

        debug!("Get classpath");
        self.classpath =
            Some(manifest.libs_as_string(&self.classpath_separator, &game_dir, &self.version)?);

        debug!("Get natives directory");
        self.natives_directory = Some(game_dir.join(format!("versions/{}/natives", self.version)));

        debug!("Build command");
        let mut command: Vec<String> = vec![];

        debug!("Command: Get exec");
        let exe_path = self
            .executable_path
            .as_ref()
            .unwrap_or(&utils::jvm::get_exec(
                &manifest
                    .java_version
                    .ok_or_else(|| {
                        LauncherLibError::Generic("Failed to get java runtime".to_string())
                    })?
                    .component,
                &game_dir,
                self.console,
            ))
            .to_str()
            .ok_or_else(|| LauncherLibError::Generic("Failed to get exe path".to_string()))?
            .to_string();

        debug!("Command: Get jvm args");
        let jvm_args = manifest.arguments.jvm_args(&self)?;
        command.extend(jvm_args);

        debug!("Command: Add user jvm args");
        if let Some(args) = &self.jvm_args {
            args.iter().for_each(|arg| command.push(arg.to_owned()));
        }

        debug!("Command: Enable Logging");
        if self.enable_logging_config {
            if let Some(logging) = manifest.logging {
                let logging_file = logging
                    .client
                    .file
                    .id
                    .expect("Failed to get logging file id");

                let logging_file = game_dir
                    .join(format!("assets/log_configs/{}", logging_file))
                    .normalize();
                let logging_str = logging_file.to_str().expect("Failed to convert");
                command.push(logging.client.argument.replace("${path}", logging_str));
            }
        }

        debug!("Command: Main class");
        command.push(manifest.main_class);

        debug!("Command: Server");
        if let Some(server) = &self.server {
            command.push("--server".to_string());
            command.push(server.clone());

            if let Some(port) = self.port {
                command.push("--port".to_string());
                command.push(port.to_string());
            }
        }

        debug!("Command: disableMultiplayer");
        if self.disable_mulitplayer {
            command.push("--disableMultiplayer".to_string());
        }

        debug!("Command: disableChat");
        if self.disable_chat {
            command.push("--disableChat".to_string());
        }

        debug!("Command: Game args");
        let game_args = manifest.arguments.game_args(&self)?;
        command.extend(game_args);

        debug!("System: Mod Setup");
        if let Some(profile) = self.profile_id {
            // prepare mods folder
            if self.forge.is_some() || self.fabric.is_some() {
                let mcl_mods_folder = game_dir.join(".mcl").join(profile);
                let mods_folder = game_dir.join("mods");

                if !mcl_mods_folder.exists() {
                    debug!("Mods: creating mods folder for profile");
                    fs::create_dir_all(&mcl_mods_folder).await?;
                }

                if mods_folder.exists() && mods_folder.is_symlink() {
                    debug!("Mods: Droping symlink folder.");
                    fs::remove_dir(&mods_folder).await?;
                }

                if consts::OS == "windows" {
                    // windows 10 does not allow creation of symlinks without admin privileges
                    // to we have a we can use junctions to get around that for now,
                    // but windows 11 should allow for this, so try creating a sym link the
                    // right way then fallback to junctions.
                    // @see https://stackoverflow.com/questions/64991523/why-are-administrator-privileges-required-to-create-a-symlink-on-windows
                    if let Err(err) = windows::fs::symlink_dir(&mcl_mods_folder, &mods_folder) {
                        warn!(
                            "Unable to create symlink thought method, using fallback. Reason: {}",
                            err.to_string()
                        );

                        if let Err(fallback_err) = tokio::process::Command::new("cmd")
                            .arg("/C")
                            .arg("mklink")
                            .arg("/J")
                            .arg(mods_folder)
                            .arg(mcl_mods_folder)
                            .output()
                            .await
                        {
                            error!("Fallback failed: {}", fallback_err.to_string());

                            return Err(LauncherLibError::Generic(
                                "Unable to create link mods folder".into(),
                            ));
                        }
                    }
                } else {
                    warn!("Did not create sys link");
                }
            }
        }

        debug!("Command: Build complete");
        Ok(Client::new(exe_path, command, game_dir.to_owned()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_module("minecraft_launcher_lib", log::LevelFilter::Debug)
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_client_builder() {
        init();

        let builder = ClientBuilder::new()
            .set_game_directory(PathBuf::from(
                "C:\\Users\\Collin\\AppData\\Roaming\\.minecraft",
            ))
            .set_version("1.19.3".to_string())
            .set_user(
                "USERNAME".to_string(),
                "UUID".to_string(),
                "XUID".to_string(),
                "TOKEN".to_string(),
            );

        match builder.build().await {
            Ok(value) => {
                println!("{:#?}", value);
            }
            Err(err) => {
                eprintln!("{}", err);
            }
        }
    }
}
