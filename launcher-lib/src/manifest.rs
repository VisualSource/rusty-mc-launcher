use std::env::consts;
use serde::{Deserialize,Serialize};
use crate::ClientBuilder;
use std::collections::HashMap;
use serde;

//          OS    Runtime
// HashMap<String,HashMap<JVM>>

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
    pub logging: Logging,
    pub main_class: String,
    pub minimum_launcher_version: Option<i64>,
    pub release_time: String,
    pub time: String,
    #[serde(rename = "type")]
    pub type_field: String,
}

impl Manifest {
    pub fn inherit(self, manifest: Manifest) -> Manifest {
        Manifest::default()
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
    fn args_to_string(list: &Vec<Arg>,  settings: &ClientBuilder) -> String {
        let mut output: Vec<String> = vec![];

        for arg in list {
            match arg {
                Arg::Flag(value) => {
                    output.push(value.to_owned());
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
        output.join(" ")
    }

    pub fn game_args_to_string(&self, settings: &ClientBuilder) -> String {
        Arguments::args_to_string(&self.game, settings)
    }
    pub fn jvm_args_to_string(&self, settings: &ClientBuilder) -> String {
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

        let builder = ClientBuilder::new().as_demo(true);
        
        let result_with_demo = arguments.game_args_to_string(&builder);

        info!("With Demo: {}",result_with_demo);

        assert_eq!(result_with_demo,"--gameDir ${game_directory} --demo".to_string());

        let builder_no_demo = builder.as_demo(false);

        let result_without_demo = arguments.game_args_to_string(&builder_no_demo);

        info!("Without Demo: {}",result_without_demo);

        assert_eq!(result_without_demo,"--gameDir ${game_directory}".to_string());
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

        let builder = ClientBuilder::default();

        let result = arguments.jvm_args_to_string(&builder);

        info!("{}",result);

        assert_eq!(result,"-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump -Dos.name=Windows 10 -Dos.version=10.0 -Djava.library.path=${natives_directory}".to_string());
    }
}