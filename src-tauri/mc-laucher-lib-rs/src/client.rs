//! The minecraft client 
//! 
//! Provides a client builder with options for settings and other player settings. 
use crate::command::get_launch_command;
use crate::expections::{LauncherLibError,LibResult};
use crate::json::install::Event;
use crate::utils::{get_minecraft_directory, read_manifest_inherit};
use crate::install::{install_minecraft_version, install_libraries};
use crate::fabric::install_fabric;
use crate::forge::install_forge;
use crate::optifine::install_optifine;
use crate::json::{
    game_settings::{ 
        GameOptions,
        UserType
    },
    authentication_microsoft::Account,
    install::VersionManifest,
    client::{ InstallManifest, Loader }
};
use std::path::PathBuf;
use log::info;
use uuid::Uuid;
use std::process::{ Command, Child };

/// Created by the ClientBuilder, the client holds all data for launching minecraft and holds the process handle
/// for minecraft. Use the ClientBuilder to get a Client
#[derive(Debug, Default)]
pub struct Client {
    options: GameOptions,
    minecraft: String,
    minecraft_directory: PathBuf,
    process: Option<Child> 
}
impl Client {
    pub fn new(minecraft: String, minecraft_directory: PathBuf, options: GameOptions) -> Self {
        Self {
            options,
            minecraft,
            minecraft_directory,
            process: None
        }
    }
    pub fn is_running(&mut self) -> LibResult<bool> {
        if let Some(p) = &mut self.process {
            match p.try_wait() {
                Ok(Some(_status)) => {
                    self.process = None;
                    Ok(false)
                },
                Ok(None) => Ok(true),
                Err(err) => Err(LauncherLibError::General(err.to_string()))
            }
        } else {
            Ok(false)
        }
    }
    pub async fn start(&mut self) -> LibResult<()> {
        if self.process.is_some() {
            return Err(LauncherLibError::General("A instance of minecraft is already running".into()));
        }

        let (java,args) = match get_launch_command(self.minecraft.clone(), self.minecraft_directory.clone(), &mut self.options).await {
            Ok(value) => value,
            Err(err) => return Err(err)
        };

        info!("{:#?}",args);

        let handler: Child = match Command::new(java)
        .args(args).current_dir(self.minecraft_directory.clone()).spawn() {
            Err(err) => return Err(LauncherLibError::OS {
                source: err,
                msg: "Failed to launch minecraft".into()
            }),
            Ok(handle) => handle
        };

        self.process = Some(handler);

        Ok(())
    }
    pub fn exit(&mut self) -> LibResult<Option<std::process::ExitStatus>> {
        if let Some(process) = &mut self.process {
            match process.wait() {
                Err(err) => return Err(LauncherLibError::OS { 
                    source: err,
                    msg: "Minecraft was not running".into()
                }),
                Ok(status) => { 
                    self.process = None;
                    return Ok(Some(status));
                }
            }
        }
        Ok(None)
    }
}

/// ClientBuilder helps build a new client and provides methods for installing clients
#[derive(Debug, Default)]
pub struct ClientBuilder {
    options: GameOptions,
    minecraft: String,
    minecraft_directory: PathBuf 
}

impl ClientBuilder {
    /// Install natives jars without having download everything else.
    pub async fn install_natives(minecraft: String, minecraft_directory: Option<PathBuf>, callback: &impl Fn(Event)) -> LibResult<()> {
        let game_dir = if let Some(dir) = minecraft_directory { dir } else { 
            match get_minecraft_directory() {
                Ok(value) => value,
                Err(err) => return Err(err)
            } 
        };

        let manifest = game_dir.join("versions").join(minecraft.clone()).join(format!("{}.json",minecraft.clone()));

        if !manifest.is_file() {
            return Err(LauncherLibError::NotFound("Failed to find version manifest".into()));
        }

        let manifest: VersionManifest = match read_manifest_inherit(manifest,&game_dir).await {
            Ok(value) => value,
            Err(err) => return Err(err)
        };

        callback(Event::Status("Installing libraries".into()));
        if let Err(err) = install_libraries(manifest.id.clone(), &manifest.libraries, game_dir,callback).await {
            return Err(err);
        }

        Ok(())
    }
    /// installs the minecraft client
    pub async fn install(manifest: InstallManifest, minecraft_directory: Option<PathBuf>, callback: &impl Fn(Event), temp_path: Option<PathBuf>, cache_path: Option<PathBuf>, java: Option<PathBuf>) -> LibResult<()> {
        let mc_dir = if let Some(dir) = minecraft_directory { dir } else { 
            match get_minecraft_directory() {
                Ok(value) => value,
                Err(err) => return Err(err)
            } 
        };

        match manifest.modloader.clone() {
            Loader::Fabric => {
                let temp = match temp_path {
                    Some(value) => value,
                    None => return Err(LauncherLibError::General("Missing temp path".into()))
                };
               install_fabric(manifest.minecraft.clone(),mc_dir,manifest.modloader_version,callback,java,temp).await
            }
            Loader::Forge => {
                let temp = match temp_path {
                    Some(value) => value,
                    None => return Err(LauncherLibError::General("Missing temp path".into()))
                };
               install_forge(manifest.minecraft.clone(), mc_dir, temp, callback, cache_path, manifest.modloader_version, java, manifest.cache_cli, manifest.cache_install).await
            }
            Loader::Optifine => {
                let temp = match temp_path {
                    Some(value) => value,
                    None => return Err(LauncherLibError::General("Missing temp path".into()))
                };
               install_optifine(manifest.minecraft.clone(), mc_dir, temp, callback, cache_path, manifest.modloader_version, java, manifest.cache_cli, manifest.cache_install).await
            }
            Loader::Vanilla => {
               install_minecraft_version(manifest.minecraft.clone(),mc_dir,callback).await
            }
        }
    }
    /// Same as install but manifest can be a string 
    pub async fn install_str(manifest: String, minecraft_directory: Option<PathBuf>, callback: &impl Fn(Event), temp_path: Option<PathBuf>, cache_path: Option<PathBuf>, java: Option<PathBuf>) -> LibResult<()> {
        match serde_json::from_str::<InstallManifest>(&manifest) {
            Err(err) => Err(LauncherLibError::ParseJsonSerde(err)),
            Ok(value) => ClientBuilder::install(value, minecraft_directory, callback, temp_path, cache_path, java).await
        }
    }
    pub fn new(minecraft_dir: Option<PathBuf>) -> LibResult<Self> {
        let mc_dir = match minecraft_dir {
            Some(value) => value,
            None => {
                match get_minecraft_directory() {
                    Ok(value) => value,
                    Err(err) => return Err(err)
                }
            }
        };

        Ok(Self {
            minecraft_directory: mc_dir,
            ..Default::default()
        })
    }
    pub fn enable_debug(&mut self) {
        if let Some(args) = &mut self.options.jvm_arguments {
            args.push_str("-Dorg.lwjgl.util.Debug=true");
        } else {
            self.options.jvm_arguments = Some("-Dorg.lwjgl.util.Debug=true".to_string());
        }
    }
    /// set the Java VM argsuments for the java runtime
    pub fn set_jvm_args(&mut self, args: String) -> &mut Self {
        if let Some(jvm) = &mut self.options.jvm_arguments {
            jvm.push_str(args.as_str());
        } else {
            self.options.jvm_arguments = Some(args);
        }
        self
    }
    /// Sets the java exe used to run the game
    pub fn set_java(&mut self, java: Option<PathBuf>) -> &mut Self {
        if let Some(path) = java {
            self.options.executable_path = Some(path);
        }
        self
    }
    /// Generates a user with a random uuid and with the name of Rusty
    /// Good for developing mods or other things, can't use on authed servers
    pub fn as_dev_user(&mut self) -> &mut Self {
        self.options.uuid = Some(Uuid::new_v4().as_hyphenated().to_string());
        self.options.username = Some("Rusty".into());
        self.options.user_type = UserType::Unkown;
        self
    }
    /// Old login method. Login user with a mojang account
    pub fn as_user(&mut self, username: String, uuid: String, token: String) -> &mut Self {
        self.options.uuid = Some(uuid);
        self.options.username = Some(username);
        self.options.token = Some(token);
        self.options.user_type = UserType::Mojang;
        self
    }
    /// Login user using a microsoft account, required for minecraft version post 1.18
    pub fn as_msa_user(&mut self, user: Account) -> &mut Self {
        self.options.user_type = UserType::Microsoft;
        self.options.xuid = Some(user.xuid.clone());
        self.options.token = Some(user.access_token.clone());
        self.options.uuid = Some(user.profile.id.clone());
        self.options.username = Some(user.profile.name.clone());
    
        self
    }
    /// Client id string 
    pub fn set_client_id(&mut self, id: String) -> &mut Self {
        self.options.client_id = Some(id);
        self
    }
    /// Enables the logging in launch command
    pub fn enable_logging(&mut self) -> &mut Self {

        self.options.enable_logging_config = true;
        
        self
    }
    /// Sets what minecraft version is loaded
    /// minecraft string can be in the form of `1.18.2` or 'fabric-loader-0.10.1-1.18.1'
    /// or passing the mod loader and version in their own params
    pub fn set_minecraft(&mut self, minecraft: String, loader: Option<Loader>, loader_version: Option<String>) -> LibResult<&mut Self> {
        match loader {
            Some(value) => {
                match value {
                    Loader::Fabric => {
                        if let Some(lv) = loader_version {
                            self.minecraft = format!("fabric-loader-{loader}-{mc}", loader=lv,mc=minecraft).to_string();
                        } else {
                            return Err(LauncherLibError::General("Missing loader version".into()))
                        }
                    },
                    Loader::Forge => {
                        if let Some(lv) = loader_version {
                            self.minecraft = format!("{mc}-forge-{loader}", loader=lv,mc=minecraft).to_string();
                        } else {
                            return Err(LauncherLibError::General("Missing loader version".into()))
                        }
                    },
                    Loader::Optifine => {
                        if let Some(lv) = loader_version {
                            self.minecraft = format!("{mc}-OptiFine_{loader}", loader=lv,mc=minecraft).to_string();
                        } else {
                            return Err(LauncherLibError::General("Missing loader version".into()))
                        }
                    }
                   _ => {
                        self.minecraft = minecraft;
                   }
                }
            }
            None => {
                self.minecraft = minecraft;
            }
        }
        Ok(self)
    }
    /// Geneartes the client for minecraft with given settings
    pub fn build(&self) -> LibResult<Client> {

        if self.minecraft.is_empty() {
            return Err(LauncherLibError::General("Minecraft version is unset".into()));
        }
        // should do some checks here like,
        // setting of the minecraft version

        Ok(Client::new(self.minecraft.clone(),self.minecraft_directory.clone(),self.options.clone()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use log::error;
    use std::thread;
    use std::time;

    fn init_logger(){
       let _ = env_logger::builder().filter_level(log::LevelFilter::Info).is_test(true).try_init();
    }

    #[tokio::test]
    async fn test_optifine_install() {
        if let Err(err) = ClientBuilder::install(
                InstallManifest::new("1.18.2".into(), Loader::Optifine), 
                None,
                &|event| { println!("{:#?}",event); },
                Some(PathBuf::from("C:\\Users\\Collin\\Downloads\\")), None, None
            ).await {
            eprintln!("{}",err);
        }
    }

    #[tokio::test]
    async fn test_forge_install() {
        init_logger();
        if let Err(err) = ClientBuilder::install(
                InstallManifest::new("1.18.1".into(), Loader::Forge), 
                None,
                &|event| { info!("{:#?}",event); },
                Some(PathBuf::from("C:\\Users\\Collin\\Downloads\\")), None, None
            ).await {
            eprintln!("{}",err);
        }
    }

    #[tokio::test]
    async fn test_fabric_install() {
        init_logger();
        if let Err(err) = ClientBuilder::install(
            InstallManifest::new("1.18.2".into(), Loader::Fabric), 
                None,
                &|_event| {  },
                Some(PathBuf::from("C:\\Users\\Collin\\Downloads\\")), None, None
            ).await {
            eprintln!("{}",err);
        }
    }

    #[tokio::test]
    async fn test_vinilla_install() {
        init_logger();

        if let Err(err) = ClientBuilder::install(
            InstallManifest::new("1.16.5".into(), Loader::Vanilla), 
                None, 
                &|_event| { }, None, None, None
            ).await {
            eprintln!("{}",err);
        }
    }
    #[tokio::test]
    async fn test_client() {
        init_logger();
        let minecraft = "1.18.1-forge-39.1.2".to_string();

        let mut builder = match ClientBuilder::new(None) {
            Ok(value) => value,
            Err(err) => {
                error!("{}",err);
                panic!();
            }
        };

        builder.set_client_id("TEST".into());
        builder.as_dev_user();
        builder.enable_debug();
        if let Err(err) = builder.set_minecraft(minecraft,None,None) {
            error!("{}",err);
            panic!();
        }

        let mut client = builder.build().expect("Failed to make client");
        if let Err(err) = client.start().await {
            error!("{}",err);
        }

        thread::sleep(time::Duration::from_secs(60));

    }

    #[tokio::test]
    async fn test_client_builder() {
        use crate::login::{ms_login_url,get_auth_code,login_microsoft};

        let client_id = std::env::var("CLIENT_ID").expect("Failed to get client id");
        let redirect: String = "https://login.microsoftonline.com/common/oauth2/nativeclient".into();

        let url = ms_login_url(client_id.clone(), redirect.clone());

        println!("{}",url);

        println!("Enter auth");

        let mut raw_auth_code = String::default();
        if let Err(err) = std::io::stdin().read_line(&mut raw_auth_code) {
            eprintln!("{}",err);
            panic!();
        }

        let auth_code = match get_auth_code(raw_auth_code) {
            Some(value)=> value,
            None => {
                eprintln!("Failed to get auth code from url");
                panic!();
            }
        };

        let account = match login_microsoft(client_id.clone(), redirect, auth_code).await {
            Ok(account) => account,
            Err(err) => {
                eprintln!("{}",err);
                panic!();
            }
        };

        match ClientBuilder::new(None) {
            Ok(mut client) => {
                let mut runner = match client
                .set_client_id(client_id)
                .as_msa_user(account)
                .set_jvm_args("-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M".into())
                .set_minecraft("1.18.1".into(),Some(Loader::Optifine),Some("HD_U_H4".into()))
                .expect("Failed to set mc ver").build() {
                    Ok(value) => value,
                    Err(err) => {
                        eprintln!("{}",err);
                        panic!();
                    }
                };

                println!("{:#?}",runner);

                if let Err(err) = runner.start().await {
                    eprintln!("{}",err);
                }

                thread::sleep(time::Duration::from_secs(10));

               /* if let Err(err)  = runner.exit() {
                    eprintln!("{}",err);
                }*/
            }
            Err(err) => eprintln!("{}",err)
        }
    }

}