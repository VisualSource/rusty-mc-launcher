use std::collections::HashMap;
use std::path::PathBuf;
use std::env::consts;

use serde::{Deserialize,Serialize, self };
use normalize_path::NormalizePath;
use log::info;

use crate::ClientBuilder;
use crate::errors::LauncherLibError;

pub mod jvm {
    use super::*;

    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct JVMDownload {
        pub lzma: Option<File>,
        pub raw: File
    }

    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct JVMFile {
        pub downloads: Option<JVMDownload>,
        pub executable: Option<bool>,
        #[serde(alias = "type")]
        pub file_type: String,
        pub target: Option<String> 
    }

    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct JVMFiles {
        pub files: HashMap<String,JVMFile>
    }

    pub type JvmManifest = HashMap<String,HashMap<String,Vec<Jvm>>>;

    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct Jvm {
        pub manifest: File,
        pub version: JvmVersion,
        pub availability: JvmAvailability,
    }
    
    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct JvmVersion {
        pub name: String,
        pub released: String
    }
    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct JvmAvailability {
        pub group: usize,
        pub progress: usize
    }
}

pub mod asset_index {
    use super::*;

    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct AssetIndexItem {
        pub hash: String,
        pub size: usize
    }
    #[derive(Default,Debug, Clone, Serialize, Deserialize)]
    pub struct AssetIndex {
        pub objects: std::collections::HashMap<String,AssetIndexItem>
    }
}

#[derive(Default,Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
    #[serde(alias = "inheritsFrom")]
    pub inherits_from: Option<String>,
    pub arguments: Arguments,
    pub asset_index: Option<File>,
    pub assets: Option<String>,
    pub compliance_level: Option<usize>,
    pub downloads: Option<Downloads>,
    pub id: String,
    pub java_version: Option<JavaVersion>,
    pub libraries: Vec<Library>,
    pub logging: Option<Logging>,
    pub main_class: String,
    pub minimum_launcher_version: Option<i64>,
    pub release_time: String,
    pub time: String,
    #[serde(rename = "type")]
    pub type_field: String,
}

impl Manifest {
    pub async fn read_manifest(manifest_dir: &PathBuf) -> Result<Manifest,LauncherLibError> {
        let manifest_raw = tokio::fs::read_to_string(&manifest_dir).await?;
        let mut manifest = serde_json::from_str::<Manifest>(&manifest_raw)?;

        if let Some(inherts) = &manifest.inherits_from {
            info!("Inherting manifest");
            let root_dir = manifest_dir.parent()
                                              .ok_or_else(||LauncherLibError::Generic("Failed to get parent dir".into()))?.parent()
                                              .ok_or_else(||LauncherLibError::Generic("Failed to get parent dir".into()))?;

            if !root_dir.exists() {
                return Err(LauncherLibError::NotFound("Failed to find parent manifest".to_string()));
            }

            // Load base manifest
            let path = root_dir.join(format!("{0}/{0}.json",inherts));

            let raw = tokio::fs::read_to_string(&path).await?;
            let base = serde_json::from_str::<Manifest>(&raw)?;

            manifest = manifest.inherit(base);
        }

        Ok(manifest)
    }

    pub fn inherit(self, manifest: Manifest) -> Manifest {
        Manifest::default()
    }

    pub fn libs_as_string(&self, seperator: &String, root: &PathBuf) -> String {

        let mut output: Vec<String> = vec![];

        for lib in &self.libraries {
            if let Some(rules) = &lib.rules {
                let allowd = rules.iter().map(|condition|{
                    match condition {
                        RuleCondition::Os { action, os } => {
                            let active = os.iter().map(|(key,map_value)|{
                                match key.as_str() {
                                    "name" => map_value.replace("osx", "macos") == consts::OS,
                                    "arch" => map_value == consts::ARCH,
                                    "version" => {
                                        if let Ok(re) = regex::Regex::new(&map_value) {
                                            let os_version = os_info::get().version().to_string();
                                            return re.is_match(&os_version);
                                        }
    
                                        false
                                    }
                                    _ => false
                                }
                            }).all(|x|x);
    
                            (action == "allow" && active) || (action == "disallow" && !active)
                        }
                        _ => false
                    }
                }).all(|x|x);
    
                if !allowd {
                    continue;
                }
            }

            if let Some(downloads) = &lib.downloads {
                let path = downloads.artifact.path.as_ref().expect("Expect path var");

                let lib_path = root.join("libraries").join(path).normalize().to_str().expect("Failed to convert to str").to_string();

                output.push(lib_path);

                if let Some(classifiers) = &downloads.classifiers {
                    let natives_list = lib.natives.as_ref().expect("Expect path var");
                    let os = if natives_list.contains_key("osx") && consts::OS == "macos" {
                        "osx"
                    } else {
                        consts::OS
                    };

                    if let Some(native_id) = natives_list.get(os) {
                        if let Some(file) = classifiers.get(native_id) {
                            let path = file.path.as_ref().expect("Expect path var");

                            let lib_path = root.join("libraries").normalize().join(path).to_str().expect("Failed to convert to str").to_string();

                            output.push(lib_path);

                        }
                    }
                }

            }
            
        }

        output.join(&seperator)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RuleValue {
    Item(String),
    List(Vec<String>)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RuleCondition {
    Features {
        action: String,
        features: std::collections::HashMap<String,bool>
    },
    Os {
        action: String,
        os: std::collections::HashMap<String,String>
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Arg {
    Flag(String),
    Rule {
        rules: Vec<RuleCondition>,
        value: RuleValue,
    }
}

#[derive(Default,Debug, Clone, Serialize, Deserialize)]
pub struct Arguments {
    pub game: Vec<Arg>,
    pub jvm: Vec<Arg>,
}

impl Arguments {
    /// Python example
    /// https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master/minecraft_launcher_lib/_helper.py#L57
    fn args_to_string(list: &Vec<Arg>,  settings: &ClientBuilder) -> Result<String, LauncherLibError> {
        let mut output: Vec<String> = vec![];

        let re = regex::Regex::new(r"\$\{(?P<target>.+)\}")?;

        for arg in list {
            match arg {
                Arg::Flag(value) => {
                    if let Some(cp) = re.captures(&value) {
                        let result = match &cp["target"] {
                            "launcher_name" => {
                                let temp = "rust-minecraft-launcher".to_string();
                                let name = settings.launcher_name.as_ref().unwrap_or(&temp);
                                value.replace("${launcher_name}", name)
                            }
                            "natives_directory" => {
                                let path = settings.natives_directory.as_ref().ok_or_else(
                                    ||LauncherLibError::Generic("Failed to get natives dir!".to_string()))?.normalize();
                                let dir = path.to_str().ok_or_else(||LauncherLibError::Generic("Failed to get natives dir!".to_string()))?;
                                value.replace("${natives_directory}", dir)
                            }
                            "launcher_version" => {
                                let temp = "0.0.0".to_string();
                                let version = settings.laucher_version.as_ref().unwrap_or(&temp);
                                value.replace("${launcher_version}", version)
                            }
                            "game_directory" => {
                                let path = settings.game_directory.as_ref().ok_or_else(
                                    ||LauncherLibError::Generic("Failed to get game dir!".to_string()))?.to_str()
                                    .ok_or_else(||LauncherLibError::Generic("Failed to get game dir!".to_string()))?;
                                value.replace("${game_directory}", path)
                            }
                            "assets_root" => {
                                let path = settings.game_directory.as_ref().ok_or_else(
                                    ||LauncherLibError::Generic("Failed to get game dir!".to_string()))?.join("assets").normalize();
                                let assets = path.to_str()
                                .ok_or_else(||LauncherLibError::Generic("Failed to get game dir!".to_string()))?;
                                value.replace("${assets_root}", assets)
                            }
                            "assets_index_name" => {
                                let name = settings.assets.as_ref().unwrap_or(&settings.version);
                                value.replace("${assets_index_name}", name)
                            }
                            "version_type" => {
                                let name = settings.version_type.as_ref().unwrap_or(value);
                                value.replace("${version_type}", name)
                            }
                            "resolution_width" => {
                                let width = settings.resolution_width.unwrap_or(854).to_string();
                                value.replace("${resolution_width}", &width)
                            }   
                            "resolution_height" => {
                                let height = settings.resolution_height.unwrap_or(480).to_string();
                                value.replace("${resolution_height}", &height)
                            }  
                            "game_assets" => {
                                let path = settings.game_directory.as_ref().ok_or_else(
                                    ||LauncherLibError::Generic("Failed to get game assets dir!".to_string()))?.join(format!("assets/virtual/legacy")).normalize();
                                let assets = path.to_str()
                                .ok_or_else(||LauncherLibError::Generic("Failed to get game assets dir!".to_string()))?;
                                value.replace("${game_assets}", assets)
                            }  
                            "library_directory" => {
                                let path = settings.game_directory.as_ref().ok_or_else(
                                    ||LauncherLibError::Generic("Failed to get library directory!".to_string()))?.join("libraries").normalize();
                                let assets = path.to_str()
                                .ok_or_else(||LauncherLibError::Generic("Failed to get library directory!".to_string()))?;
                                value.replace("${library_directory}", assets)
                            }
                            "clientid" => {
                                let id = settings.client_id.as_ref()
                                .ok_or_else(||LauncherLibError::Generic("Failed to get library directory!".to_string()))?;
                                value.replace("${clientid}", id)
                            }
                            "classpath" => settings.classpath.to_owned(),
                            "auth_player_name" => settings.username.to_owned(),
                            "version_name" => settings.version.to_owned(),
                            "auth_uuid" => settings.uuid.to_owned(),
                            "auth_access_token" => settings.token.to_owned(),
                            "user_type" => "msa".to_string(),
                            "user_properties" => "{}".to_string(),
                            "auth_session" => settings.token.to_owned(),
                            "auth_xuid" => settings.xuid.to_owned(),
                            "classpath_separator" => settings.classpath_separator.to_owned(),

                            _ => value.to_owned()
                        };

                        output.push(result);
                    } else {
                        output.push(value.to_owned());
                    }
                }
                Arg::Rule { rules, value } => {

                    let inact = rules.iter().map(| condition |{
                        match condition {
                            RuleCondition::Features { action, features } => {
                                let active = features.iter().map(|(key,_)|{
                                    match key.as_str() {
                                        "is_demo_user" => settings.is_demo,
                                        "has_custom_resolution" => settings.use_custom_resolution,
                                        _ => false
                                    }
                                }).all(|x|x);

                                (action == "allow" && active) || (action == "disallow" && !active)
                            }
                            RuleCondition::Os { action, os } => {
                                let active = os.iter().map(|(key,map_value)|{
                                    match key.as_str() {
                                        "name" => map_value.replace("osx", "macos") == consts::OS,
                                        "arch" => map_value == consts::ARCH,
                                        "version" => {
                                            if let Ok(re) = regex::Regex::new(&map_value) {
                                                let os_version = os_info::get().version().to_string();
                                                return re.is_match(&os_version);
                                            }

                                            false
                                        }
                                        _ => false
                                    }
                                }).all(|x|x);

                                (action == "allow" && active) || (action == "disallow" && !active)
                            }
                        }
                    }).all(|x|x);

                    if !inact {
                        continue;
                    }

                    match value {
                        RuleValue::Item(flag) => output.push(flag.to_owned()),
                        RuleValue::List(flags) => output.extend(flags.to_owned())
                    }
                }
            }
        }
        Ok(output.join(" "))
    }

    pub fn game_args_to_string(&self, settings: &ClientBuilder) -> Result<String, LauncherLibError> {
        Arguments::args_to_string(&self.game, settings)
    }
    pub fn jvm_args_to_string(&self, settings: &ClientBuilder) -> Result<String, LauncherLibError>{
        Arguments::args_to_string(&self.jvm, settings)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Downloads {
    pub client: File,
    pub server: File,
    pub server_mappings: Option<File>,
    pub client_mappings: Option<File>
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct JavaVersion {
    pub component: String,
    pub major_version: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Library {
    pub downloads: Option<LibraryDownloads>,
    pub name: String,
    pub url: Option<String>,
    pub natives: Option<std::collections::HashMap<String,String>>,
    pub extract: Option<Extract>,
    #[serde(default)]
    pub rules: Option<Vec<RuleCondition>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryDownloads {
    pub artifact: File,
    pub classifiers: Option<std::collections::HashMap<String,File>>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Extract {
    pub exclude: Vec<String>,
}

#[derive(Default,Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Logging {
    pub client: LoggingClient,
}

#[derive(Default,Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoggingClient {
    pub argument: String,
    pub file: File,
    #[serde(rename = "type")]
    pub type_field: String,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct File {
    pub path: Option<String>,
    pub id: Option<String>,
    pub total_size: Option<usize>,
    pub sha1: String,
    pub size: i64,
    pub url: String,
}

#[cfg(test)]
mod tests {
    use super::*;
    use log::info;

    fn init() {
        let _ = env_logger::builder().filter_level(log::LevelFilter::max()).is_test(true).try_init();
    }

    #[tokio::test] 
    async fn test_libs_to_string(){
        init();

        let manifest_dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft\\versions\\1.19.3\\1.19.3.json");
        let manifest = Manifest::read_manifest(&manifest_dir).await.unwrap();

        let result = manifest.libs_as_string(&";".to_string(),&PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft"));

        info!("{}",result);
    }

    #[test]
    fn test_arg_game(){
        init();

        let arguments = Arguments { game: vec![
            Arg::Flag("--gameDir".to_string()),
            Arg::Flag("${game_directory}".to_string()),
            Arg::Rule { 
                rules: vec![
                    RuleCondition::Features { 
                        action: "allow".to_string(), 
                        features: std::collections::HashMap::from(
                            [
                               ( "is_demo_user".to_string(),true)
                            ]
                        )
                    }
                ], 
                value: RuleValue::Item("--demo".to_string())
            }
        ], jvm: vec![] };

        let builder = ClientBuilder::new().as_demo(true).set_game_directory(PathBuf::from("C:/"));
        
        let result_with_demo = arguments.game_args_to_string(&builder).unwrap();

        info!("With Demo: {}",result_with_demo);

        assert_eq!(result_with_demo,"--gameDir C:/ --demo".to_string());

        let builder_no_demo = builder.as_demo(false);

        let result_without_demo = arguments.game_args_to_string(&builder_no_demo).unwrap();

        info!("Without Demo: {}",result_without_demo);

        assert_eq!(result_without_demo,"--gameDir C:/".to_string());
    }
    #[test]
    fn test_arg_jvm(){
        init();

        let arguments = Arguments { game: vec![], jvm: vec![
            Arg::Rule { 
                rules: vec![
                    RuleCondition::Os { 
                        action: "allow".to_string(), 
                        os: std::collections::HashMap::from(
                            [
                               ("name".to_string(),"windows".to_string())
                            ]
                        )
                    }
                ], 
                value: RuleValue::Item("-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump".to_string())
            },
            Arg::Rule {
                rules: vec![
                    RuleCondition::Os { 
                        action: "allow".to_string(), 
                        os: std::collections::HashMap::from([
                           ( "name".to_string(), "windows".to_string()), 
                           ( "version".to_string(), "^10\\.".to_string())
                        ])
                    }
                ],
                value: RuleValue::List(vec![
                    "-Dos.name=Windows 10".to_string(),
                    "-Dos.version=10.0".to_string()
                ])
            },
            Arg::Flag("-Djava.library.path=${natives_directory}".to_string())
        ] };

        let builder = ClientBuilder::default().set_natives_directory(PathBuf::from("C:/"));

        let result = arguments.jvm_args_to_string(&builder).unwrap();

        info!("{}",result);

        assert_eq!(result,"-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Dos.name=Windows 10 -Dos.version=10.0 -Djava.library.path=C:\\".to_string());
    }
}