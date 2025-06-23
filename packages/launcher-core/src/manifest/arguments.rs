use crate::manifest::rule::Rule;
use lazy_regex::regex_replace_all;
use serde::{Deserialize, Serialize};

/*const REPLACEMENT_KEYS: [&str; 23] = [
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
];*/

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct Arguments {
    #[serde(default)]
    pub game: Vec<Arg>,
    #[serde(default)]
    pub jvm: Vec<Arg>,
}

impl Arguments {
    /// reslove the condtions and value in arg list into a usable string vector
    pub fn reslove_args(
        list: &[Arg],
        rule_reslover: fn(name: &str, value: &Option<bool>) -> bool,
        reslover: fn(key: &str) -> Option<String>,
    ) -> Vec<String> {
        list.iter()
            .filter_map(|arg| arg.parse(rule_reslover, reslover))
            .collect::<Vec<String>>()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RuleValue {
    Item(String),
    List(Vec<String>),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Arg {
    Flag(String),
    Rule { rules: Vec<Rule>, value: RuleValue },
}

impl Arg {
    fn replace_arg(flag: &str, resolver: fn(key: &str) -> Option<String>) -> String {
        let text = regex_replace_all!(r#"\$\{([\w\d]+)\}"#, flag, |_, name| resolver(name)
            .unwrap_or_default());

        text.to_string()
    }
    fn parse(
        &self,
        rule_reslover: fn(name: &str, value: &Option<bool>) -> bool,
        value_reslover: fn(key: &str) -> Option<String>,
    ) -> Option<String> {
        match self {
            Self::Flag(flag) => Some(Self::replace_arg(flag, value_reslover)),
            Self::Rule { rules, value } => {
                if Rule::parse_list(rules, rule_reslover) {
                    let flag = match value {
                        RuleValue::Item(item) => item.to_owned(),
                        RuleValue::List(items) => items
                            .iter()
                            .map(|flag| Arg::replace_arg(flag, value_reslover))
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

#[cfg(test)]
mod tests {
    use indexmap::IndexMap;

    use super::*;

    #[test]
    fn test_replace_arg_alone() {
        let value = Arg::replace_arg("${version_type}", |key| {
            if key == "version_type" {
                Some("release".into())
            } else {
                None
            }
        });

        assert_eq!(value, "release".to_string());
    }

    #[test]
    fn test_replace_arg() {
        let value = Arg::replace_arg("-DlibraryDirectory=${library_directory}", |key| {
            if key == "library_directory" {
                Some("C:\\path".to_string())
            } else {
                None
            }
        });

        assert_eq!(value, "-DlibraryDirectory=C:\\path".to_string());
    }

    #[test]
    fn test_replace_arg_multi() {
        let value = Arg::replace_arg(
            "${library_directory}/cpw/mods/securejarhandler/2.1.24/securejarhandler-2.1.24.jar${classpath_separator}${library_directory}/org/ow2/asm/asm/9.5/asm-9.5.jar",
            |key| {
                if key == "library_directory" {
                    Some("C://path".to_string())
                } else if key == "classpath_separator" {
                    Some(";".into())
                } else {
                    None
                }
            },
        );

        assert_eq!(value, "C://path/cpw/mods/securejarhandler/2.1.24/securejarhandler-2.1.24.jar;C://path/org/ow2/asm/asm/9.5/asm-9.5.jar".to_string());
    }

    #[test]
    fn test_parse_arg_flag_plane() {
        let arg = Arg::Flag("--assetIndex".into());

        let result = arg.parse(|_key, _value| false, |_key| None);

        assert_eq!(result, Some("--assetIndex".to_string()))
    }

    #[test]
    fn test_parse_arg_flag_replace() {
        let arg = Arg::Flag("${assets_index_name}".into());

        let result = arg.parse(
            |_key, _value| false,
            |key| {
                if key == "assets_index_name" {
                    Some("17".into())
                } else {
                    None
                }
            },
        );

        assert_eq!(result, Some("17".to_string()))
    }

    #[test]
    fn test_parse_arg_feature_multi_value() {
        let mut features = IndexMap::new();
        features.insert("has_custom_resolution".to_string(), Some(true));

        let arg = Arg::Rule {
            rules: vec![Rule::Feature {
                action: "allow".into(),
                features,
            }],
            value: RuleValue::List(vec![
                "--width".into(),
                "${resolution_width}".into(),
                "--height".into(),
                "${resolution_height}".into(),
            ]),
        };

        let result = arg.parse(
            |key, _value| key == "has_custom_resolution",
            |key| {
                if key == "resolution_height" {
                    Some("1080".into())
                } else if key == "resolution_width" {
                    Some("1920".into())
                } else {
                    None
                }
            },
        );

        assert_eq!(result, Some("--width 1920 --height 1080".to_string()))
    }

    #[test]
    fn test_parse_arg_feature_single_value() {
        let mut features = IndexMap::new();
        features.insert("is_demo_user".to_string(), Some(true));

        let arg = Arg::Rule {
            rules: vec![Rule::Feature {
                action: "allow".into(),
                features,
            }],
            value: RuleValue::Item("--demo".into()),
        };

        let result = arg.parse(
            |key, _value| key == "is_demo_user",
            |_key| {
                panic!("should not have called reslover");
            },
        );

        assert_eq!(result, Some("--demo".to_string()))
    }
}
