use indexmap::IndexMap;
use lazy_regex::Regex;
use serde::{Deserialize, Serialize};
use std::env::consts;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Rule {
    Feature {
        action: String,
        features: IndexMap<String, Option<bool>>,
    },
    Os {
        action: String,
        os: IndexMap<String, String>,
    },
    Action {
        action: String,
    },
}

impl Rule {
    /// parse a list of rules
    pub fn parse_list(
        rules: &[Rule],
        features_resolver: fn(name: &str, value: &Option<bool>) -> bool,
    ) -> bool {
        rules
            .iter()
            .all(|condition| condition.parse(features_resolver).unwrap_or_default())
    }
    /// reslove rule to a bool
    ///
    ///<details>
    /// <summary>Known features</summary>
    ///
    /// - is_demo_user
    /// - has_custom_resolution
    /// - has_quick_plays_support
    /// - is_quick_play_realms
    /// - is_quick_play_singleplayer
    /// - is_quick_play_multiplayer
    ///</details>  
    ///
    pub fn parse(
        &self,
        features_resolver: fn(name: &str, value: &Option<bool>) -> bool,
    ) -> Option<bool> {
        match self {
            Self::Feature { action, features } => {
                let result = features
                    .iter()
                    .all(|(feature, value)| features_resolver(feature, value));

                Some((action == "allow" && result) || (action == "disallow" && !result))
            }
            Self::Action { action } => Some(action == "allow"),
            Self::Os { action, os } => {
                let allowed = os.iter().all(|(key, value)| match key.as_str() {
                    "name" => value.replace("osx", "macos") == consts::OS,
                    "arch" => value == consts::ARCH,
                    "version" => match Regex::new(value) {
                        Ok(regex) => regex.is_match(&os_info::get().version().to_string()),
                        Err(error) => {
                            log::error!("{}", error);
                            false
                        }
                    },
                    _ => {
                        log::error!("unhandled os rule condition: '{}'", key);
                        false
                    }
                });

                Some((action == "allow" && allowed) || (action == "disallow" && !allowed))
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_feature_allow() {
        let mut features = IndexMap::new();
        features.insert("is_demo_user".to_string(), Some(true));
        let rule = Rule::Feature {
            action: "allow".into(),
            features,
        };

        let result = rule.parse(|key, option| key == "is_demo_user" && option == &Some(true));

        assert_eq!(result, Some(true));
    }

    #[test]
    fn test_parse_feature_allow_value_false() {
        let mut features = IndexMap::new();
        features.insert("is_demo_user".to_string(), Some(true));
        let rule = Rule::Feature {
            action: "allow".into(),
            features,
        };

        let result = rule.parse(|key, option| key == "is_demo_user" && option == &Some(false));

        assert_eq!(result, Some(false));
    }

    #[test]
    fn test_parse_feature_disallow() {
        let mut features = IndexMap::new();
        features.insert("is_demo_user".to_string(), Some(false));
        let rule = Rule::Feature {
            action: "disallow".into(),
            features,
        };

        let result = rule.parse(|key, option| key == "is_demo_user" && option == &Some(true));

        assert_eq!(result, Some(true));
    }

    #[test]
    fn test_parse_feature_disallow_value_false() {
        let mut features = IndexMap::new();
        features.insert("is_demo_user".to_string(), Some(false));
        let rule = Rule::Feature {
            action: "disallow".into(),
            features,
        };

        let result = rule.parse(|key, option| key == "is_demo_user" && option == &Some(false));

        assert_eq!(result, Some(false));
    }

    #[test]
    fn test_parse_list() {
        let list = vec![
            serde_json::from_str::<Rule>(
                r#"{
                    "action": "allow",
                    "features": {
                        "is_demo_user": true
                    }
                }"#,
            )
            .expect("Failed to parse rule"),
        ];

        let result = Rule::parse_list(&list, |_key, _value| true);

        assert!(result);
    }
}
