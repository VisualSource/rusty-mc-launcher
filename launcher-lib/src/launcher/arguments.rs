use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RuleValue {
    Item(String),
    List(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RuleCondition {
    Features {
        action: String,
        features: std::collections::HashMap<String, Option<bool>>,
    },
    Os {
        action: String,
        os: std::collections::HashMap<String, String>,
    },
}

impl RuleCondition {
    pub fn parse(&self, config: Option<&super::Config>) -> Option<bool> {
        match self {
            Self::Features { action, features } => {
                let config = config?;
                let result = features
                    .iter()
                    .all(|(feature, value)| match feature.as_str() {
                        "is_demo_user" => *value == config.is_demo_user(),
                        "has_custom_resolution" => *value == config.has_custom_resolution(),
                        "is_quick_play_realms" => *value == config.is_quick_play_realms(),
                        "has_quick_plays_support" => *value == config.has_quick_plays_support(),
                        "is_quick_play_multiplayer" => *value == config.is_quick_play_multiplayer(),
                        _ => false,
                    });

                Some((action == "allow" && result) || (action == "disallow" && !result))
            }
            Self::Os { action, os } => {
                let allowed = os.iter().all(|(key, value)| match key.as_str() {
                    "name" => value.replace("osx", "macos") == std::env::consts::OS,
                    "arch" => value == std::env::consts::ARCH,
                    "version" => match regex::Regex::new(value) {
                        Ok(regex) => regex.is_match(&os_info::get().version().to_string()),
                        Err(error) => {
                            log::error!("{}", error);
                            false
                        }
                    },
                    _ => false,
                });

                Some((action == "allow" && allowed) || (action == "disallow" && !allowed))
            }
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Arg {
    Flag(String),
    Rule {
        rules: Vec<RuleCondition>,
        value: RuleValue,
    },
}

impl Arg {
    fn replace_arg(flag: &String, config: &super::Config) -> String {
        match lazy_regex::regex_captures!(r"\$\{(?P<target>.+)\}", flag) {
            Some((_, target)) => match config.get_replacement(target) {
                Some(flag_value) => {
                    let key = format!("${{{}}}", target);
                    flag.replace(&key, &flag_value)
                }
                None => flag.to_owned(),
            },
            _ => flag.to_owned(),
        }
    }
    fn parse(&self, config: &super::Config) -> Option<String> {
        match self {
            Self::Flag(flag) => Some(Self::replace_arg(flag, config)),
            Arg::Rule { rules, value } => {
                let result = rules
                    .iter()
                    .all(|condition| condition.parse(Some(config)).unwrap_or(false));

                if result {
                    let flag = match value {
                        RuleValue::Item(item) => item.to_owned(),
                        RuleValue::List(items) => items
                            .iter()
                            .map(|flag| Arg::replace_arg(flag, config))
                            .collect::<Vec<String>>()
                            .join(" "),
                    };
                    Some(flag)
                } else {
                    None
                }
            }
        }
    }
}

// target ${} in arguments
/// Python example
/// https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master/minecraft_launcher_lib/_helper.py#L57
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct Arguments {
    pub game: Vec<Arg>,
    pub jvm: Vec<Arg>,
}

impl Arguments {
    pub fn parse_args(list: &[Arg], config: &super::Config) -> Vec<String> {
        list.iter()
            .filter_map(|arg| arg.parse(config))
            .collect::<Vec<String>>()
    }
}

#[cfg(test)]
mod tests {
    use crate::launcher::Config;

    use super::*;
    const MINECRAFT_ARGUMENTS_1_20_6: &str = r#"{
        "game": [
          "--username",
          "${auth_player_name}",
          "--version",
          "${version_name}",
          "--gameDir",
          "${game_directory}",
          "--assetsDir",
          "${assets_root}",
          "--assetIndex",
          "${assets_index_name}",
          "--uuid",
          "${auth_uuid}",
          "--accessToken",
          "${auth_access_token}",
          "--clientId",
          "${clientid}",
          "--xuid",
          "${auth_xuid}",
          "--userType",
          "${user_type}",
          "--versionType",
          "${version_type}",
          {
            "rules": [
              {
                "action": "allow",
                "features": { "is_demo_user": true, "is_quick_play_realms": null }
              }
            ],
            "value": "--demo"
          },
          {
            "rules": [
              {
                "action": "allow",
                "features": {
                  "has_custom_resolution": true,
                  "is_quick_play_realms": null
                }
              }
            ],
            "value": [
              "--width",
              "${resolution_width}",
              "--height",
              "${resolution_height}"
            ]
          },
          {
            "rules": [
              {
                "action": "allow",
                "features": {
                  "has_quick_plays_support": true,
                  "is_quick_play_realms": null
                }
              }
            ],
            "value": ["--quickPlayPath", "${quickPlayPath}"]
          },
          {
            "rules": [
              {
                "action": "allow",
                "features": {
                  "is_quick_play_singleplayer": true,
                  "is_quick_play_realms": null
                }
              }
            ],
            "value": ["--quickPlaySingleplayer", "${quickPlaySingleplayer}"]
          },
          {
            "rules": [
              {
                "action": "allow",
                "features": {
                  "is_quick_play_multiplayer": true,
                  "is_quick_play_realms": null
                }
              }
            ],
            "value": ["--quickPlayMultiplayer", "${quickPlayMultiplayer}"]
          },
          {
            "rules": [
              { "action": "allow", "features": { "is_quick_play_realms": true } }
            ],
            "value": ["--quickPlayRealms", "${quickPlayRealms}"]
          }
        ],
        "jvm": [
          {
            "rules": [{ "action": "allow", "os": { "name": "osx" } }],
            "value": ["-XstartOnFirstThread"]
          },
          {
            "rules": [{ "action": "allow", "os": { "name": "windows" } }],
            "value": "-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump"
          },
          {
            "rules": [{ "action": "allow", "os": { "arch": "x86" } }],
            "value": "-Xss1M"
          },
          "-Djava.library.path=${natives_directory}",
          "-Djna.tmpdir=${natives_directory}",
          "-Dorg.lwjgl.system.SharedLibraryExtractPath=${natives_directory}",
          "-Dio.netty.native.workdir=${natives_directory}",
          "-Dminecraft.launcher.brand=${launcher_name}",
          "-Dminecraft.launcher.version=${launcher_version}",
          "-cp",
          "${classpath}"
        ]
      }
    "#;

    fn test_value(input: &'static str) -> Arguments {
        serde_json::from_str(input).expect("Failed to parse arguments")
    }

    #[test]
    fn test_game_args_parse() {
        let minecraft_1_20_6 = test_value(MINECRAFT_ARGUMENTS_1_20_6);

        let config = Config {
            auth_player_name: "TEST_USERNAME".to_string(),
            auth_access_token: "token".to_string(),
            version_name: "1.20".to_string(),
            game_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            runtime_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            version: "1.20".to_string(),
            additonal_java_arguments: None,
            resolution_height: None,
            resolution_width: None,
            quick_play_multiplayer: None,
            quick_play_path: None,
            quick_play_realms: None,
            demo: false,
            quick_play_single_player: None,
            launcher_name: None,
            launcher_version: None,
            assets_index_name: "16".to_string(),
            auth_uuid: "uuid".to_string(),
            clientid: "CLIENT_ID".to_string(),
            auth_xuid: "XUID".to_string(),
            user_type: "msa".to_string(),
            version_type: "VERSION".to_string(),
            classpath: String::new(),
        };

        println!("{:#?}", minecraft_1_20_6);

        let result = Arguments::parse_args(&minecraft_1_20_6.game, &config);

        assert_eq!(
            result,
            vec![
                "--username",
                "TEST_USERNAME",
                "--version",
                "1.20",
                "--gameDir",
                "C://",
                "--assetsDir",
                "C://",
                "--assetIndex",
                "16",
                "--uuid",
                "uuid",
                "--accessToken",
                "token",
                "--clientId",
                "CLIENT_ID",
                "--xuid",
                "XUID",
                "--userType",
                "msa",
                "--versionType",
                "VERSION",
            ]
        )
    }

    #[test]
    fn test_game_args_parse_with_res() {
        let minecraft_1_20_6 = test_value(MINECRAFT_ARGUMENTS_1_20_6);

        let config = Config {
            auth_player_name: "TEST_USERNAME".to_string(),
            auth_access_token: "token".to_string(),
            version_name: "1.20".to_string(),
            game_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            runtime_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            version: "1.20".to_string(),
            additonal_java_arguments: None,
            resolution_height: Some("542".to_string()),
            resolution_width: Some("854".to_string()),
            quick_play_multiplayer: None,
            quick_play_path: None,
            quick_play_realms: None,
            demo: false,
            quick_play_single_player: None,
            launcher_name: None,
            launcher_version: None,
            assets_index_name: "16".to_string(),
            auth_uuid: "uuid".to_string(),
            clientid: "CLIENT_ID".to_string(),
            auth_xuid: "XUID".to_string(),
            user_type: "msa".to_string(),
            version_type: "VERSION".to_string(),
            classpath: String::new(),
        };

        let result = Arguments::parse_args(&minecraft_1_20_6.game, &config);

        assert_eq!(
            result,
            vec![
                "--username",
                "TEST_USERNAME",
                "--version",
                "1.20",
                "--gameDir",
                "C://",
                "--assetsDir",
                "C://",
                "--assetIndex",
                "16",
                "--uuid",
                "uuid",
                "--accessToken",
                "token",
                "--clientId",
                "CLIENT_ID",
                "--xuid",
                "XUID",
                "--userType",
                "msa",
                "--versionType",
                "VERSION",
                "--width 854 --height 542",
            ]
        )
    }

    #[test]
    fn test_java_args_parse() {
        let minecraft_1_20_6 = test_value(MINECRAFT_ARGUMENTS_1_20_6);

        let config = Config {
            auth_player_name: "TEST_USERNAME".to_string(),
            auth_access_token: "token".to_string(),
            version_name: "1.20".to_string(),
            game_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            runtime_directory: std::path::PathBuf::from_str("C://").expect("Failed to make path"),
            version: "1.20".to_string(),
            additonal_java_arguments: None,
            resolution_height: Some("542".to_string()),
            resolution_width: Some("854".to_string()),
            quick_play_multiplayer: None,
            quick_play_path: None,
            quick_play_realms: None,
            demo: false,
            quick_play_single_player: None,
            launcher_name: None,
            launcher_version: None,
            assets_index_name: "16".to_string(),
            auth_uuid: "uuid".to_string(),
            clientid: "CLIENT_ID".to_string(),
            auth_xuid: "XUID".to_string(),
            user_type: "msa".to_string(),
            version_type: "VERSION".to_string(),
            classpath: String::new(),
        };

        let result = Arguments::parse_args(&minecraft_1_20_6.jvm, &config);

        assert_eq!(result,vec!["-XX:HeapDumpPath=MojangTricksIntelDriversForPerformance_javaw.exe_minecraft.exe.heapdump",  
        "-Djava.library.path=C://natives_directory",
        "-Djna.tmpdir=C://natives_directory",
        "-Dorg.lwjgl.system.SharedLibraryExtractPath=C://natives_directory",
        "-Dio.netty.native.workdir=C://natives_directory",
        "-Dminecraft.launcher.brand=TEST",
        "-Dminecraft.launcher.version=0.0.0",
        "-cp",
        "C://classpath"])
    }
}
