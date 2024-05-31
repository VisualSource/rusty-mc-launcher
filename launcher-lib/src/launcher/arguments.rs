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
    Action {
        action: String,
    },
}

const REPLACEMENT_KEYS: [&str; 23] = [
    "user_type",
    "clientid",
    "assets_root",
    "game_directory",
    "natives_directory",
    "assets_index_name",
    "version_type",
    "classpath",
    "version_name",
    "auth_xuid",
    "auth_uuid",
    "auth_access_token",
    "auth_player_name",
    "library_directory",
    "classpath_separator",
    "quickPlayRealms",
    "quickPlayMultiplayer",
    "quickPlaySingleplayer",
    "quickPlayPath",
    "launcher_name",
    "launcher_version",
    "resolution_width",
    "resolution_height",
];

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
                        "is_quick_play_singleplayer" => {
                            *value == config.is_quick_play_singleplayer()
                        }
                        "is_quick_play_multiplayer" => *value == config.is_quick_play_multiplayer(),
                        _ => false,
                    });

                Some((action == "allow" && result) || (action == "disallow" && !result))
            }
            Self::Action { action } => Some(action == "allow"),
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

pub fn parse_rules(config: Option<&super::Config>, rules: &[RuleCondition]) -> bool {
    rules
        .iter()
        .all(|condition| condition.parse(config).unwrap_or_default())
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
    fn replace_arg(flag: &str, config: &super::Config) -> String {
        let mut flag = flag.to_string();
        for key in REPLACEMENT_KEYS {
            let target = format!("${{{}}}", key);
            // TOOO FIX THIS
            if let Some(r) = config.get_replacement(key) {
                flag = flag.replace(&target, r);
            }
        }

        flag
    }
    fn parse(&self, config: &super::Config) -> Option<String> {
        match self {
            Self::Flag(flag) => Some(Self::replace_arg(flag, config)),
            Arg::Rule { rules, value } => {
                if parse_rules(Some(config), rules) {
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
    #[serde(default)]
    pub game: Vec<Arg>,
    #[serde(default)]
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
    use super::*;

    #[test]
    fn test_parse_rules() {
        let rules: Vec<RuleCondition> = serde_json::from_str(
            r#"
      [
        { "action": "allow" },
        { "action": "disallow", "os": { "name": "osx" } },
        { "action": "disallow", "os": { "name": "linux-arm64" } },
        { "action": "disallow", "os": { "name": "linux-arm32" } },
        { "action": "disallow", "os": { "name": "osx-arm64" } }
      ]
      "#,
        )
        .expect("Failed to parse");

        assert!(parse_rules(None, &rules));

        let rules2: Vec<RuleCondition> = serde_json::from_str(
            r#"
        [{ "action": "allow", "os": { "name": "osx" } }]
        "#,
        )
        .expect("Failed to build");

        assert!(!parse_rules(None, &rules2))
    }
}
