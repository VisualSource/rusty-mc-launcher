/// Minecraft rust launcher library for launcher minecraft with/without mods
/// https://ryanccn.dev/posts/inside-a-minecraft-launcher/
mod errors;
pub mod installer;
mod manifest;
mod metadata;
pub mod observer;
mod runtime;
mod utils;

use log::debug;
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};
use std::{env::consts, path::PathBuf};
use tokio::process::{Child, Command};

pub use errors::LauncherLibError;
use manifest::Manifest;

//https://github.com/tomsik68/mclauncher-api/wiki

// 1. Auth
// 2. check/install
// 3. build exec cmd
// 4. run

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
    pub fn is_running(self) -> Result<Option<std::process::ExitStatus>, LauncherLibError> {
        if let Some(mut pid) = self.process {
            return Ok(pid.try_wait()?);
        }

        Ok(None)
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
    launcher_name: Option<String>,
    laucher_version: Option<String>,
    classpath: String,
    assets: Option<String>,
    version_type: Option<String>,
    console: bool,
    classpath_separator: String,
    game_directory: Option<PathBuf>,
    version: String,
    token: String,
    uuid: String,
    xuid: String,
    username: String,
    executable_path: Option<PathBuf>,
    jvm_args: Option<Vec<String>>,
    use_custom_resolution: bool,
    is_demo: bool,
    resolution_width: Option<usize>,
    resolution_height: Option<usize>,
    server: Option<String>,
    port: Option<usize>,
    natives_directory: Option<PathBuf>,
    enable_logging_config: bool,
    disable_mulitplayer: bool,
    disable_chat: bool,
    forge: Option<String>,
    fabric: Option<String>,
    client_id: Option<String>,
}

impl ClientBuilder {
    pub fn new() -> Self {
        Self::default()
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
        debug!("Get Classpath separator");
        self.classpath_separator = if consts::OS == "windows" { ";" } else { ":" }.to_string();
        debug!("Get Game dir");
        let game_dir = if let Some(dir) = &self.game_directory {
            dir
        } else {
            return Err(LauncherLibError::Generic(
                "Game Directory is not set.".to_string(),
            ));
        };

        // exec_path + jvmArgs+ (client jvm args) + logging + mainClass + gameFlags + ?(extraFlags)
        // fabric / forge check

        debug!("Get manifest");
        let path = game_dir.join(format!("versions/{0}/{0}.json", self.version));
        let manifest = Manifest::read_manifest(&path, true).await?;

        self.assets = manifest.assets.clone();

        debug!("Get classpath");
        self.classpath =
            manifest.libs_as_string(&self.classpath_separator, &game_dir, &self.version)?;

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
