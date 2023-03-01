mod errors;
mod metadata;
mod installer;
mod manifest;

use std::path::PathBuf;
//https://github.com/tomsik68/mclauncher-api/wiki

// 1. Auth
// 2. check/install
// 3. build exec cmd
// 4. run


#[derive(Default)]
pub struct Client {
    game_directory: PathBuf,
    exec_cmd: String
}

impl Client {
    pub fn run(self) {

    }
}

#[derive(Default)]
pub struct ClientBuilder {
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
    fabric: Option<String>
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
        self.natives_directory = Some(dir);
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

    pub fn build(self) -> Client {

        // fabric / forge check

        Client {
            game_directory: PathBuf::new(),
            exec_cmd: String::new()
        }
    }
}


#[cfg(test)]
mod tests {
    use super::*;
  
}

