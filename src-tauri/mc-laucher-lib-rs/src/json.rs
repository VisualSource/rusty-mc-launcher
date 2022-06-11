use serde::{Deserialize, Serialize }; 
use crate::expections::{ LauncherLibError, LibResult };
use std::collections::HashMap;
use std::path::PathBuf;

pub mod client {
    use super::*;

    #[derive(Debug, Clone, Deserialize, Serialize)]
    pub enum Loader {
        #[serde(rename="fabric")]
        Fabric,
        #[serde(rename="forge")]
        Forge,
        #[serde(rename="vanilla")]
        Vanilla,
        #[serde(rename="optifine")]
        Optifine
    }
    impl Loader {
        pub fn to_string(&self) -> String {
            match self {
                Loader::Fabric => "fabric".to_string(),
                Loader::Forge => "forge".to_string(),
                Loader::Optifine => "optifine".to_string(),
                Loader::Vanilla => "vanilla".to_string()
            }
        }
    }
    impl Default for Loader {
        fn default() -> Self { Loader::Vanilla }
    }

    #[derive(Deserialize, Debug)]
    pub struct Mod {
        pub id: String,
        pub url: String,
        pub name: String
    }

    #[derive(Deserialize, Debug)]
    pub struct InstallManifest {
        pub cache_install: bool,
        pub cache_cli: bool,
        pub cache_mods: bool,
        pub minecraft: String,
        pub modloader_version: Option<String>,
        pub modloader: Loader,
        pub mods: Vec<Mod>
    }
    impl InstallManifest {
        pub fn new(version: String, modloader: Loader) -> Self {
            Self {
                minecraft: version,
                modloader,
                modloader_version: None,
                mods: vec![],
                cache_cli: false,
                cache_install: false,
                cache_mods: false
            }
        }
    } 
}

pub mod minecraft_account {
    use super::*;

    #[derive(Deserialize,Serialize, Clone, Debug)]
    pub struct PlayerCapes {
        pub id: String,
        pub state: String,
        pub url: String,
        pub alias: Option<String>,
        pub varient: Option<String>,
    }

    #[derive(Deserialize,Serialize, Clone, Debug)]
    pub struct PlayerSkins {
        pub id: String,
        pub state: String,
        pub url: String,
        pub varient: Option<String>,
        pub alias: Option<String>,
    }

    #[derive(Deserialize,Serialize, Clone, Debug)]
    pub struct PlayerProfile {
        pub id: String,
        pub name: String,
        pub skins: Vec<PlayerSkins>,
        pub capes: Vec<PlayerCapes>
    }
}

pub mod authentication_microsoft {
    use super::*;

    #[derive(Debug, Serialize, Deserialize)]
    pub struct Claims {
        pub xuid: String,
        agg: String,
        sub: String,
        nbf: usize,
        auth: String,
        roles: Vec<String>,
        iss: String,
        exp: usize,
        iat: usize,
        platform: String,
        yuid: String
    }

    #[derive(Deserialize, Serialize, Clone, Debug)]
    pub struct Account {
        pub profile: minecraft_account::PlayerProfile,
        pub access_token: String,
        pub refresh_token: String,
        pub xuid: String
    }

    #[derive(Deserialize, Debug)]
    pub struct GameOwnerShipItem {
        pub name: String,
        pub signature: String
    }

    #[derive(Deserialize, Debug)]
    pub struct GameOwnership {
        pub items: Vec<GameOwnerShipItem>,
        pub signature: String,
        #[serde(rename="keyId")]
        pub key_id: String
    }

    #[derive(Deserialize, Debug)]
    pub struct MinecraftJson {
        pub access_token: String,
        pub username: String,
        pub token_type: String,
        pub expires_in: usize,
        pub roles: Vec<String>
    }

    impl MinecraftJson {
        pub fn get_xuid(self) -> LibResult<String> {
            let token_data = self.access_token.split(".").collect::<Vec<&str>>();
            match base64::decode(token_data[1]) {
                Ok(buffer) => {
                    match String::from_utf8(buffer) {
                        Ok(value) => {
                            match serde_json::from_str::<authentication_microsoft::Claims>(&value) {
                                Ok(id) => Ok(id.xuid),
                                Err(err) => Err(LauncherLibError::ParseJsonSerde(err))
                            } 
                        },
                        Err(err) => Err(LauncherLibError::General(format!("{}", err)))
                    }
                },
                Err(err) => Err(LauncherLibError::General(format!("{}", err)))
            }
        }
    }

    #[derive(Deserialize, Debug)]
    pub struct AuthoriztionJson {
        pub token_type: String,
        pub expires_in: usize,
        pub scope: String,
        pub access_token: String,
        pub refresh_token: String,
        pub user_id: String,
        pub foci: Option<String>
    }

    #[derive(Deserialize, Serialize, Debug, Clone)]
    pub struct XboxLiveCliamsItem {
        pub uhs: String
    }

    #[derive(Deserialize, Serialize, Debug, Clone)]
    pub struct XboxLiveClaims {
        pub xui: Vec<XboxLiveCliamsItem>
    }

    #[derive(Deserialize, Serialize, Debug, Clone)]
    pub struct XboxLiveJson {
        #[serde(rename="Token")]
        pub token: String,
        #[serde(rename="DisplayClaims")]
        pub display_claims: XboxLiveClaims,
        #[serde(rename="IssueInstant")]
        pub issue_instant: String,
        #[serde(rename="NotAfter")]
        pub not_after: String
    }

    impl XboxLiveJson {
        pub fn get_userhash(&self) -> Option<String> {
            match self.display_claims.xui.get(0) {
                Some(value) => Some(value.uhs.clone()),
                None => None
            }
        }
    }
}

pub mod game_settings {
    use super::*;

    #[derive(Debug,Clone)]
    pub enum UserType {
        Microsoft,
        Legacy,
        Mojang,
        Unkown,
    }
    impl UserType {
        pub fn to_string(&self) -> String {
            match self {
                Self::Legacy => "legacy".into(),
                Self::Microsoft => "msa".into(),
                Self::Mojang => "mojang".into(),
                Self::Unkown => "unknown".into()
            }
        }
    }
    impl Default for UserType {
        fn default() -> UserType {
            UserType::Unkown
        }
    }

    #[derive(Default,Debug,Clone)]
    pub struct GameOptions {
        pub user_type: UserType,
        pub navtives_directory: Option<PathBuf>,
        pub classpath: Option<String>,
        pub executable_path: Option<PathBuf>,
        pub jvm_arguments: Option<String>,
        pub custom_resolution: Option<String>,
        pub demo: bool,
        pub launcher_name: Option<String>,
        pub launcher_version: Option<String>,
        pub username: Option<String>,
        pub game_directory: Option<PathBuf>,
        pub uuid: Option<String>,
        pub token: Option<String>,
        pub resolution_width: Option<String>,
        pub resolution_height: Option<String>,
        pub enable_logging_config: bool,
        pub logging_path: Option<PathBuf>,
        pub server: Option<String>,
        pub port: Option<String>,
        pub xuid: Option<String>,
        pub client_id: Option<String>
    }
}

pub mod runtime {
    use super::*;

    #[derive(Deserialize,Debug)]
    pub struct JVMFFileDownloadOptions {
        pub lzma: Option<install::DownloadableFile>,
        pub raw: install::DownloadableFile
    }


    #[derive(Deserialize,Debug)]
    pub struct JVMFileProps {
        #[serde(rename="type")]
        pub action: String,
        pub executable: Option<bool>,
        pub downloads: Option<JVMFFileDownloadOptions>,
        pub target: Option<String>

    }

    #[derive(Deserialize,Debug)]
    pub struct JVMFiles {
        pub files: HashMap<String,JVMFileProps>
    }

    #[derive(Deserialize, Debug, Clone)]
    pub enum MinecraftJavaRuntime {
        #[serde(rename="java-runtime-gamma")]
        JavaRuntimeGamma,
        #[serde(rename="java-runtime-alpha")]
        JavaRuntimeAlpha,
        #[serde(rename="java-runtime-beta")]
        JavaRuntimeBeta,
        #[serde(rename="minecraft-java-exe")]
        MinecraftJavaExe,
        #[serde(rename="jre-legacy")]
        JreLegacy,
        Unkown(String)
    }
    impl MinecraftJavaRuntime {
        pub fn use_latest() -> MinecraftJavaRuntime {
            MinecraftJavaRuntime::JavaRuntimeGamma
        } 
        pub fn to_string(&self) -> String {
            match self {
                Self::JavaRuntimeGamma => "java-runtime-gamma".into(),
                MinecraftJavaRuntime::JavaRuntimeAlpha => "java-runtime-alpha".into(),
                MinecraftJavaRuntime::JavaRuntimeBeta => "java-runtime-beta".into(),
                MinecraftJavaRuntime::MinecraftJavaExe => "minecraft-java-exe".into(),
                MinecraftJavaRuntime::JreLegacy => "jre-legacy".into(),
                MinecraftJavaRuntime::Unkown(value) => value.clone()
            }
        }
    }

    #[derive(Deserialize,Debug,Clone)]
    pub struct RuntimeAvailabilityData {
        pub group: usize,
        pub progress: usize
    }

    #[derive(Deserialize,Debug,Clone)]
    pub struct RuntimeVersionData {
        pub name: String,
        pub released: String
    }

    #[derive(Deserialize,Debug,Clone)]
    pub struct RuntimeData {
        pub availability: RuntimeAvailabilityData,
        pub manifest: install::DownloadableFile,
        pub version: RuntimeVersionData
    }

    pub type JvmManifest = HashMap<String, HashMap<String, Vec<RuntimeData>>>;
}

pub mod launcher_version {
    use super::Deserialize;

    #[derive(Deserialize, Debug)]
    pub struct VersionsManifestLatest {
        pub release: String,
        pub snapshot: String
    }
    
    #[derive(Deserialize, Debug)]
    pub struct VersionsManifestVersion {
        pub id: String,
        #[serde(rename="type")]
        pub version_type: String,
        pub url: String,
        pub time: String,
        #[serde(rename="releaseTime")]
        pub release_time: String
    }
    
    #[derive(Deserialize, Debug)]
    pub struct VersionsManifest {
        pub latest: VersionsManifestLatest,
        pub versions: Vec<VersionsManifestVersion>
    }
    
}

pub mod install {
    use super::*;

    #[derive(Deserialize, Debug, Clone)]
    pub struct DownloadableFile {
        pub path: Option<String>,
        pub id: Option<String>,
        pub sha1: String,
        pub size: usize,
        #[serde(rename="totalSize")]
        pub total_size: Option<usize>,
        pub url: String
    }

    #[derive(Debug)]
    pub enum DownloadState {
        Exists,
        ExistsUnchecked,
        Download,
        DownloadChecked,
        Failed
    }

    impl DownloadState {
        pub fn to_string(&self) -> String {
            match self {
                Self::Exists => "Exists".to_string(),
                Self::ExistsUnchecked => "ExistsUnchecked".to_string(),
                Self::Download => "Download".to_string(),
                Self::DownloadChecked => "DownloadChecked".to_string(),
                Self::Failed => "Failed".to_string()
            }
        }
    }

    #[derive(Debug)]
    pub enum Event {
        Error(String),
        Status(String),
        Download {
            state: DownloadState,
            msg: String
        },
        Progress {
            max: usize,
            current: usize
        }
    }
    impl Event {
        pub fn download(state: DownloadState, msg: String) -> Self {
            Event::Download {
                state,
                msg
            }
        }
        pub fn progress(current: usize, max: usize) -> Self {
            Event::Progress {
                max,
                current
            }
        }
    }

    #[derive(Deserialize, Debug, Clone)]
    pub struct Rule {
        pub action: String,
        pub os: Option<HashMap<String,String>>,
        pub features: Option<HashMap<String,bool>>
    }
    
    #[derive(Deserialize, Debug, Clone)]
    #[serde(untagged)]
    pub enum Argument {
        Arg(String),
        RuleMulti {
            rules: Vec<Rule>,
            value: Vec<String>
        },
        RuleSingle {
            rules: Vec<Rule>,
            value: String
        }
    }
    
    #[derive(Deserialize, Debug, Clone)]
    pub struct Arguments {
        pub game: Vec<Argument>,
        #[serde(default)]
        pub jvm: Vec<Argument>
    }
    
    #[derive(Deserialize, Debug)]
    pub struct JavaComponent {
        pub component: runtime::MinecraftJavaRuntime,
        #[serde(rename="majorVersion")]
        pub major_version: usize
    }
    
    #[derive(Deserialize, Debug, Clone)]
    pub struct LibraryDownloads {
        pub artifact: DownloadableFile,
        pub classifiers: Option<HashMap<String, DownloadableFile>>
    }
    
    #[derive(Deserialize, Debug, Clone)]
    pub struct ExtractFile {
        pub exclude: Vec<String>
    }
    
    #[derive(Deserialize, Debug, Clone)]
    pub struct Library {
        pub downloads: Option<LibraryDownloads>,
        pub name: String,
        pub url: Option<String>,
        pub natives: Option<HashMap<String,String>>,
        pub extract: Option<ExtractFile>,
        pub rules: Option<Vec<Rule>>
    }
    
    #[derive(Deserialize, Debug)]
    pub struct LoggingConfig {
        pub argument: String,
        pub file: DownloadableFile,
        #[serde(rename="type")]
        pub logging_type: String
    }
    
    #[derive(Deserialize, Debug)]
    pub struct VersionManifest {
        pub _comment_: Option<Vec<String>>,
        pub arguments: Arguments,
        #[serde(rename="assetIndex")]
        pub asset_index: Option<DownloadableFile>,
        pub assets: Option<String>,
        #[serde(rename="complianceLevel")]
        pub compliance_level: Option<usize>,
        pub downloads: Option<HashMap<String,DownloadableFile>>,
        pub id: String,
        #[serde(rename="javaVersion")]
        pub java_version: Option<JavaComponent>,
        pub libraries: Vec<Library>,
        pub logging: Option<HashMap<String,LoggingConfig>>,
        #[serde(rename="mainClass")]
        pub main_class: String,
        #[serde(rename="minimumLauncherVersion")]
        pub minimum_launcher_version: Option<usize>,
        #[serde(rename="releaseTime")]
        pub release_time: String,
        pub time: String,
        #[serde(rename="type")]
        pub release_type: Option<String>,
        #[serde(rename="inheritsFrom")]
        pub inherits_from: Option<String>,
        pub jar: Option<String>
    }
}

