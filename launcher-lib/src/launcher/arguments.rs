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
    pub fn parse(&self, state: Option<&super::state::State>) -> Option<bool> {
        match self {
            Self::Features { action, features } => {
                let state = state?;
                let result = features
                    .iter()
                    .all(|(feature, value)| match feature.as_str() {
                        "is_demo_user" => state.is_demo_user == *value,
                        "has_custom_resolution" => state.has_custom_resolution == *value,
                        "is_quick_play_realms" => state.is_quick_play_realms == *value,
                        "has_quick_plays_support" => state.has_quick_plays_support == *value,
                        "is_quick_play_multiplayer" => state.is_quick_play_multiplayer == *value,
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
    fn replace_arg(flag: &String, flags: &std::collections::HashMap<String, String>) -> String {
        match lazy_regex::regex_captures!(r"\$\{(?P<target>.+)\}", flag) {
            Some((_, target)) => match flags.get(target) {
                Some(flag_value) => {
                    let key = format!("${{{}}}", target);
                    flag.replace(&key, flag_value)
                }
                None => flag.to_owned(),
            },
            _ => flag.to_owned(),
        }
    }
    fn parse(
        &self,
        state: &super::state::State,
        flags: &std::collections::HashMap<String, String>,
    ) -> Option<String> {
        match self {
            Self::Flag(flag) => Some(Self::replace_arg(flag, flags)),
            Arg::Rule { rules, value } => {
                let result = rules
                    .iter()
                    .all(|condition| condition.parse(Some(state)).unwrap_or(false));

                if result {
                    let flag = match value {
                        RuleValue::Item(item) => item.to_owned(),
                        RuleValue::List(items) => items
                            .iter()
                            .map(|flag| Arg::replace_arg(flag, flags))
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
    pub fn parse_args(
        list: &[Arg],
        state: &super::state::State,
        flags: &std::collections::HashMap<String, String>,
    ) -> Vec<String> {
        list.iter()
            .filter_map(|arg| arg.parse(state, flags))
            .collect::<Vec<String>>()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::launcher::state::State;
    use std::collections::HashMap;
    const MINECRAFT_ARGUMENTS_1_20_6: &str = r#"
    {
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

        let state = State::default();
        let flags: HashMap<String, String> = std::collections::HashMap::from_iter([
            ("auth_player_name".to_string(), "TEST_USERNAME".to_string()),
            ("version_name".to_string(), "1.20".to_string()),
            ("game_directory".to_string(), "C://".to_string()),
            ("assets_root".to_string(), "C://".to_string()),
            ("assets_index_name".to_string(), "16".to_string()),
            ("auth_uuid".to_string(), "uuid".to_string()),
            ("auth_access_token".to_string(), "token".to_string()),
            ("clientid".to_string(), "CLIENT_ID".to_string()),
            ("auth_xuid".to_string(), "XUID".to_string()),
            ("user_type".to_string(), "msa".to_string()),
            ("version_type".to_string(), "VERSION".to_string()),
        ]);

        println!("{:#?}", minecraft_1_20_6);

        let result = Arguments::parse_args(&minecraft_1_20_6.game, &state, &flags);

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

        let mut state = State::default();
        state.has_custom_resolution = Some(true);

        let flags: HashMap<String, String> = std::collections::HashMap::from_iter([
            ("auth_player_name".to_string(), "TEST_USERNAME".to_string()),
            ("version_name".to_string(), "1.20".to_string()),
            ("game_directory".to_string(), "C://".to_string()),
            ("assets_root".to_string(), "C://".to_string()),
            ("assets_index_name".to_string(), "16".to_string()),
            ("auth_uuid".to_string(), "uuid".to_string()),
            ("auth_access_token".to_string(), "token".to_string()),
            ("clientid".to_string(), "CLIENT_ID".to_string()),
            ("auth_xuid".to_string(), "XUID".to_string()),
            ("user_type".to_string(), "msa".to_string()),
            ("version_type".to_string(), "VERSION".to_string()),
            ("resolution_width".to_string(), "854".to_string()),
            ("resolution_height".to_string(), "542".to_string()),
        ]);

        let result = Arguments::parse_args(&minecraft_1_20_6.game, &state, &flags);

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

        let state = State::default();
        let flags: HashMap<String, String> = std::collections::HashMap::from_iter([
            (
                "natives_directory".to_string(),
                "C://natives_directory".to_string(),
            ),
            ("launcher_name".to_string(), "TEST".to_string()),
            ("launcher_version".to_string(), "0.0.0".to_string()),
            ("classpath".to_string(), "C://classpath".to_string()),
        ]);

        let result = Arguments::parse_args(&minecraft_1_20_6.jvm, &state, &flags);

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
