use crate::manifest::maven::MavenRepository;
use crate::manifest::rule::Rule;
use crate::manifest::structs::File;
use indexmap::IndexMap;
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};
/// A library reference defined into the manifest file.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Library {
    pub downloads: Option<LibraryDownload>,
    #[serde(with = "MavenRepository")]
    pub name: MavenRepository,
    pub url: Option<String>,
    pub sha1: Option<String>,
    pub natives: Option<IndexMap<String, String>>,
    pub extract: Option<Extract>,
    #[serde(default)]
    pub rules: Option<Vec<Rule>>,

    pub include_in_classpath: Option<bool>,
}

impl Library {
    #[cfg(target_os = "windows")]
    pub const PATH_SEPEARTOR: &'static str = ";";
    #[cfg(not(target_os = "windows"))]
    pub const PATH_SEPEARTOR: &'static str = ":";

    /// creates a absulote path given a root
    pub fn get_absolute_path(&self, root: &std::path::Path) -> Option<String> {
        let include = if let Some(rules) = &self.rules {
            Rule::parse_list(rules, |_key, _value| false)
        } else {
            true
        };

        if !(self.include_in_classpath.unwrap_or(true) && include) {
            return None;
        }

        let lib = self.name.as_classpath();

        Some(root.join(lib).normalize().to_string_lossy().to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryDownload {
    pub artifact: File,
    pub classifiers: Option<IndexMap<String, File>>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Extract {
    pub exclude: Vec<String>,
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;

    #[test]
    fn test_parse_library() {
        let result = serde_json::from_str::<Library>(
            r#"{
                "downloads": {
                    "artifact": {
                        "path": "com/github/oshi/oshi-core/6.4.10/oshi-core-6.4.10.jar",
                        "sha1": "b1d8ab82d11d92fd639b56d639f8f46f739dd5fa",
                        "size": 979212,
                        "url": "https://libraries.minecraft.net/com/github/oshi/oshi-core/6.4.10/oshi-core-6.4.10.jar"
                    }
                },
                "name": "com.github.oshi:oshi-core:6.4.10"
            }"#,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_library_simple() {
        let result = serde_json::from_str::<Library>(
            r#"{
                "name": "net.fabricmc:intermediary:1.21.1",
                "url": "https://maven.fabricmc.net/"
            }"#,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_parse_library_with_rules() {
        let result = serde_json::from_str::<Library>(
            r#"{
            "downloads": {
                "artifact": {
                    "path": "org/lwjgl/lwjgl-freetype/3.3.3/lwjgl-freetype-3.3.3-natives-windows.jar",
                    "sha1": "81091b006dbb43fab04c8c638e9ac87c51b4096d",
                    "size": 1035586,
                    "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-freetype/3.3.3/lwjgl-freetype-3.3.3-natives-windows.jar"
                }
            },
            "name": "org.lwjgl:lwjgl-freetype:3.3.3:natives-windows",
            "rules": [
                {
                    "action": "allow",
                    "os": {
                        "name": "windows"
                    }
                }
            ]
        }"#,
        );

        assert!(result.is_ok());
    }

    #[test]
    fn test_get_absolute_path() {
        let result = serde_json::from_str::<Library>(
            r#"{
                "name": "net.fabricmc:intermediary:1.21.1",
                "url": "https://maven.fabricmc.net/"
            }"#,
        )
        .expect("failed to parse library");

        let root = std::path::PathBuf::from_str("C:\\").expect("Failedt to make path");

        let path = result.get_absolute_path(&root).expect("failed to unwrap");

        assert_eq!(
            path,
            "C:\\net\\fabricmc\\intermediary\\1.21.1\\intermediary-1.21.1.jar".to_string()
        );
    }
}
