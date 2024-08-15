use log::info;
use normalize_path::NormalizePath;
use serde::{self, Deserialize, Serialize};
use std::env::consts;
use std::path::PathBuf;

use crate::error::Error;
use crate::launcher::arguments::{parse_rules, Arguments, RuleCondition};

pub mod asset_index {
    use super::*;

    #[derive(Default, Debug, Clone, Serialize, Deserialize)]
    pub struct AssetIndexItem {
        pub hash: String,
        pub size: i32,
    }
    #[derive(Default, Debug, Clone, Serialize, Deserialize)]
    pub struct AssetIndex {
        pub objects: std::collections::HashMap<String, AssetIndexItem>,
    }
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
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
    pub release_type: String,
}

impl Manifest {
    pub async fn read_manifest(manifest_dir: &PathBuf, do_inhert: bool) -> Result<Manifest, Error> {
        let manifest_raw = tokio::fs::read_to_string(&manifest_dir).await?;
        let mut manifest = serde_json::from_str::<Manifest>(&manifest_raw)?;

        if do_inhert {
            if let Some(inherts) = &manifest.inherits_from {
                info!("Inherting manifest");
                let root_dir = manifest_dir
                    .parent()
                    .ok_or_else(|| Error::Generic("Failed to get parent dir".into()))?
                    .parent()
                    .ok_or_else(|| Error::Generic("Failed to get parent dir".into()))?;

                if !root_dir.exists() {
                    return Err(Error::NotFound(
                        "Failed to find parent manifest".to_string(),
                    ));
                }

                // Load base manifest
                let path = root_dir.join(format!("{0}/{0}.json", inherts));

                let raw = tokio::fs::read_to_string(&path).await?;
                let base_manifest = serde_json::from_str::<Manifest>(&raw)?;

                manifest = base_manifest.inherit(manifest);
            }
        }

        Ok(manifest)
    }

    pub fn inherit(mut self, manifest: Manifest) -> Manifest {
        self.id = manifest.id;
        self.release_time = manifest.release_time;
        self.time = manifest.time;
        self.release_type = manifest.release_type;
        self.main_class = manifest.main_class;
        self.inherits_from = manifest.inherits_from;

        self.arguments.game.extend(manifest.arguments.game);
        self.arguments.jvm.extend(manifest.arguments.jvm);

        let lib_names = self
            .libraries
            .iter()
            .map(|lib| lib.name.replace("@jar", "").clone())
            .collect::<Vec<_>>();

        for lib in manifest.libraries {
            if !lib_names.contains(&lib.name.replace("@jar", "")) {
                self.libraries.push(lib);
                continue;
            }
            log::info!("Ignoring {}", lib.name);
        }

        self
    }

    pub fn libs_as_string(
        &self,
        root: &std::path::Path,
        version: &String,
    ) -> Result<String, Error> {
        let libraries_path = root.join("libraries");

        let mut classpath = Vec::new();
        for lib in &self.libraries {
            if let Some(path) = lib.get_lib(&libraries_path)? {
                classpath.push(path);
            }
        }

        let client_jar = root
            .join(format!("versions/{0}/{0}.jar", version))
            .normalize()
            .to_string_lossy()
            .to_string();

        classpath.push(client_jar);
        Ok(classpath.join(Library::get_class_sep()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Downloads {
    pub client: File,
    pub server: File,
    pub server_mappings: Option<File>,
    pub client_mappings: Option<File>,
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
    pub sha1: Option<String>,
    pub natives: Option<std::collections::HashMap<String, String>>,
    pub extract: Option<Extract>,
    #[serde(default)]
    pub rules: Option<Vec<RuleCondition>>,

    pub include_in_classpath: Option<bool>,
}

impl Library {
    pub fn get_class_sep() -> &'static str {
        if consts::OS == "windows" {
            ";"
        } else {
            ":"
        }
    }

    pub fn get_artifact_path(artifact: &str) -> Result<String, Error> {
        let name_items = artifact.split(':').collect::<Vec<&str>>();

        let package = name_items.first().ok_or_else(|| {
            Error::NotFound(format!("Unable to find package for library {}", &artifact))
        })?;
        let name = name_items.get(1).ok_or_else(|| {
            Error::NotFound(format!("Unable to find name for library {}", &artifact))
        })?;

        if name_items.len() == 3 {
            let version_ext = name_items
                .get(2)
                .ok_or_else(|| {
                    Error::NotFound(format!("Unable to find version for library {}", &artifact))
                })?
                .split('@')
                .collect::<Vec<&str>>();
            let version = version_ext.first().ok_or_else(|| {
                Error::NotFound(format!("Unable to find version for library {}", &artifact))
            })?;
            let ext = version_ext.get(1);

            Ok(format!(
                "{}/{}/{}/{}-{}.{}",
                package.replace('.', "/"),
                name,
                version,
                name,
                version,
                ext.unwrap_or(&"jar")
            ))
        } else {
            let version = name_items.get(2).ok_or_else(|| {
                Error::NotFound(format!("Unable to find version for library {}", &artifact))
            })?;

            let data_ext = name_items
                .get(3)
                .ok_or_else(|| {
                    Error::NotFound(format!("Unable to find data for library {}", &artifact))
                })?
                .split('@')
                .collect::<Vec<&str>>();
            let data = data_ext.first().ok_or_else(|| {
                Error::NotFound(format!("Unable to find data for library {}", &artifact))
            })?;
            let ext = data_ext.get(1);

            Ok(format!(
                "{}/{}/{}/{}-{}-{}.{}",
                package.replace('.', "/"),
                name,
                version,
                name,
                version,
                data,
                ext.unwrap_or(&"jar")
            ))
        }
    }

    fn get_lib(&self, root: &std::path::Path) -> Result<Option<String>, Error> {
        let include = if let Some(rules) = &self.rules {
            parse_rules(None, rules)
        } else {
            true
        };

        if !(self.include_in_classpath.unwrap_or(true) && include) {
            return Ok(None);
        }

        let lib = Library::get_artifact_path(&self.name)?;

        Ok(Some(
            root.join(lib).normalize().to_string_lossy().to_string(),
        ))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LibraryDownloads {
    pub artifact: File,
    pub classifiers: Option<std::collections::HashMap<String, File>>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Extract {
    pub exclude: Vec<String>,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Logging {
    pub client: Option<LoggingClient>,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
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
    pub total_size: Option<i32>,
    pub sha1: String,
    pub size: i32,
    pub url: String,
}

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;
    use log::{debug, info};

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[test]
    fn test_get_lib_no_download() {
        let library: Library = serde_json::from_str(r#"
        {
            "sha1": "aa205cf0a06dbd8e04ece91c0b37c3f5d567546a",
            "sha256": "3c6fac2424db3d4a853b669f4e3d1d9c3c552235e19a319673f887083c2303a1",
            "size": 123598,
            "name": "org.ow2.asm:asm:9.6",
            "sha512": "01a5ea6f5b43bf094c52a50e18325a60af7bb02e74d24f9bc2c727d43e514578fd968b30ff22f9d2720caec071458f9ff82d11a21fbb1ebc42d8203e737c4b52",
            "url": "https://maven.fabricmc.net/",
            "md5": "6f8bccf756f170d4185bb24c8c2d2020"
          }
        "#).expect("Failed to build");

        let root = PathBuf::from_str("C://libraries").expect("Failed to build path");

        let lib = library
            .get_lib(&root)
            .expect("Failed to get library path")
            .unwrap();
        // org.ow2.asm  asm  9.6
        assert_eq!(lib, "C:\\libraries\\org\\ow2\\asm\\asm\\9.6\\asm-9.6.jar")
    }

    #[test]
    fn test_get_lib_path_classifers() {
        let library: Library = serde_json::from_str(r#"
        {
            "downloads": {
              "artifact": {
                "path": "org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6.jar",
                "sha1": "75a08ab96db25e3dd05a127e69e314deb0c13161",
                "size": 299086,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6.jar"
              },
              "classifiers": {
                "natives-linux": {
                  "path": "org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-linux.jar",
                  "sha1": "52eca3486b0c022e68a32e054ae93ea001ec5b0f",
                  "size": 79787,
                  "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-linux.jar"
                },
                "natives-windows": {
                  "path": "org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-windows.jar",
                  "sha1": "a6ebe0dfde6c29836cbd928177012265ec4a8418",
                  "size": 237025,
                  "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-windows.jar"
                },
                "natives-macos": {
                  "path": "org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-macos.jar",
                  "sha1": "4511eb54308ec79f16bb3c762af2444da681f0de",
                  "size": 36945,
                  "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.1.6/lwjgl-3.1.6-natives-macos.jar"
                }
              }
            },
            "name": "org.lwjgl:lwjgl:3.1.6",
            "natives": {
              "linux": "natives-linux",
              "osx": "natives-macos",
              "windows": "natives-windows"
            },
            "rules": [
              { "action": "disallow", "os": { "name": "linux-arm64" } },
              { "action": "disallow", "os": { "name": "linux-arm32" } },
              { "action": "disallow", "os": { "name": "osx-arm64" } }
            ],
            "include_in_classpath": true
          }
        "#).expect("Failed build lib");

        let root = PathBuf::from_str("C://libraries").expect("Failed to build path");

        let lib = library
            .get_lib(&root)
            .expect("Failed to get library path")
            .unwrap();

        assert_eq!(
            lib,
            "C:\\libraries\\org\\lwjgl\\lwjgl\\3.1.6\\lwjgl-3.1.6.jar;C:\\libraries\\org\\lwjgl\\lwjgl\\3.1.6\\lwjgl-3.1.6-natives-windows.jar"
        )
    }

    #[test]
    fn test_get_lib_path() {
        let library: Library = serde_json::from_str(
            r#"
        {
            "downloads": {
              "artifact": {
                "path": "org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3-natives-windows-x86.jar",
                "sha1": "9e670718e050aeaeea0c2d5b907cffb142f2e58f",
                "size": 139653,
                "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3-natives-windows-x86.jar"
              }
            },
            "name": "org.lwjgl:lwjgl:3.3.3:natives-windows-x86",
            "rules": [{ "action": "allow", "os": { "name": "windows" } }],
            "include_in_classpath": true
          }
        "#,
        ).expect("Failed to parse library json");

        let root = PathBuf::from_str("C://libraries").expect("Failed to build path");

        let lib = library
            .get_lib(&root)
            .expect("Failed to get library path")
            .unwrap();

        assert_eq!(
            lib,
            "C:\\libraries\\org\\lwjgl\\lwjgl\\3.3.3\\lwjgl-3.3.3-natives-windows-x86.jar"
        )
    }

    #[tokio::test]
    async fn test_manifest_inhert() {
        init();
        let manifest_dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\us.visualsource.rmcl\\runtime\\versions\\fabric-loader-0.15.11-1.20.6\\fabric-loader-0.15.11-1.20.6.json");
        let manifest = Manifest::read_manifest(&manifest_dir, true).await.unwrap();

        debug!("{:#?}", manifest);
    }

    #[tokio::test]
    async fn test_libs_to_string() {
        init();

        let manifest_dir = PathBuf::from(
            "C:\\Users\\Collin\\AppData\\Roaming\\.minecraft\\versions\\1.19.3\\1.19.3.json",
        );
        let manifest = Manifest::read_manifest(&manifest_dir, false).await.unwrap();

        let result = manifest
            .libs_as_string(
                &PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft"),
                &"1.19.3".to_string(),
            )
            .unwrap();

        info!("{}", result);
    }
}
