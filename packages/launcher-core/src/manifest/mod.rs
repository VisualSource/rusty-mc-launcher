//! Structs and fucntion for working with the minecraft manifest file
//!
//! See <https://ryanccn.dev/posts/inside-a-minecraft-launcher>
//! for information on how libraries are sturctured
//!
mod arguments;
pub mod library;
mod maven;
mod rule;
mod structs;
use crate::error::{Error, Result};
use arguments::Arguments;
use indexmap::IndexMap;
use library::Library;
use normalize_path::NormalizePath;
use serde::{Deserialize, Serialize};
use std::path::Path;
use structs::File;

/// The minecraft manifest file
#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Manifest {
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
    /// Load a minecraft manifest file with optional inherting of parent manifest.
    pub async fn read_manifest(manifest_path: &Path, inhert: bool) -> Result<Manifest> {
        let manifest_raw = tokio::fs::read_to_string(&manifest_path).await?;
        let mut manifest = serde_json::from_str::<Manifest>(&manifest_raw)?;

        if inhert {
            if let Some(inherts) = &manifest.inherits_from {
                log::debug!("Inherting manifest from '{}'", inherts);
                let root_dir = manifest_path
                    .parent()
                    .and_then(Path::parent)
                    .ok_or_else(|| Error::NotFound("".to_string()))?;
                if !root_dir.exists() {
                    return Err(Error::NotFound("manifest file does not exist".to_string()));
                }

                // Load base manifest
                let path = root_dir.join(format!("{0}/{0}.json", inherts));

                let raw = tokio::fs::read_to_string(&path).await?;
                let base_manifest = serde_json::from_str::<Manifest>(&raw)?;

                manifest = base_manifest.inherit(manifest)?;
            }
        }

        Ok(manifest)
    }

    /// Merges two manifests together
    pub fn inherit(mut self, manifest: Manifest) -> Result<Manifest> {
        self.id = manifest.id;
        self.release_time = manifest.release_time;
        self.time = manifest.time;
        self.release_type = manifest.release_type;
        self.main_class = manifest.main_class;
        self.inherits_from = manifest.inherits_from;

        self.arguments.game.extend(manifest.arguments.game);
        self.arguments.jvm.extend(manifest.arguments.jvm);
        self.libraries.extend(manifest.libraries);

        let mut seen = IndexMap::new();
        for lib in self.libraries.drain(..) {
            let package = lib.name.package();
            if seen.contains_key(&package) {
                let saved: &Library = seen
                    .get(&package)
                    .ok_or_else(|| Error::NotFound("Failed to find library".to_string()))?;

                let saved_version = lenient_semver::parse(saved.name.version())
                    .map_err(|err| Error::Semver(err.to_string()))?;
                let current_version = lenient_semver::parse(lib.name.version())
                    .map_err(|err| Error::Semver(err.to_string()))?;

                // dont replace saved version if current version is not new the the current.
                if saved_version > current_version {
                    continue;
                }
            }

            seen.insert(package, lib);
        }

        self.libraries = seen.into_values().collect::<Vec<_>>();

        Ok(self)
    }

    /// convert libraries vector into a classpath string.
    pub fn as_classpath(&self, root: &Path, version: &str) -> Result<String> {
        let libraries_path = root.join("libraries");

        let mut classpath = Vec::new();
        for lib in &self.libraries {
            if let Some(path) = lib.get_absolute_path(&libraries_path) {
                classpath.push(path);
            }
        }

        let client_jar = root
            .join(format!("versions/{0}/{0}.jar", version))
            .normalize()
            .to_string_lossy()
            .to_string();

        classpath.push(client_jar);
        Ok(classpath.join(Library::PATH_SEPEARTOR))
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

#[cfg(test)]
mod tests {
    use crate::manifest::Manifest;
    use std::str::FromStr;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    fn get_manifest_one() -> Manifest {
        serde_json::from_value::<Manifest>(serde_json::json!({
            "arguments": {
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
                    "${version_type}"
                ],
                "jvm": [
                    "-Djava.library.path=${natives_directory}",
                    "-Djna.tmpdir=${natives_directory}",
                    "-Dorg.lwjgl.system.SharedLibraryExtractPath=${natives_directory}",
                    "-Dio.netty.native.workdir=${natives_directory}",
                    "-Dminecraft.launcher.brand=${launcher_name}",
                    "-Dminecraft.launcher.version=${launcher_version}",
                    "-cp",
                    "${classpath}"
                ]
            },
            "assetIndex": {
                "id": "5",
                "sha1": "fa470e836e0a1cd47748cd924223c7ebc4477e9a",
                "size": 412373,
                "totalSize": 633540150,
                "url": "https://piston-meta.mojang.com"
            },
            "assets": "5",
            "complianceLevel": 1,
            "downloads": {
                "client": {
                    "sha1": "e575a48efda46cf88111ba05b624ef90c520eef1",
                    "size": 23028278,
                    "url": "https://piston-data.mojang.com/"
                },
                "client_mappings": {
                    "sha1": "a4cd9a97400f7ecfe4dba23e427549ebc5815d66",
                    "size": 8001434,
                    "url": "https://piston-data.mojang.com/"
                },
                "server": {
                    "sha1": "15c777e2cfe0556eef19aab534b186c0c6f277e1",
                    "size": 47787288,
                    "url": "https://piston-data.mojang.com/"
                },
                "server_mappings": {
                    "sha1": "15e61168fd24c7950b22cd3b9e771a7ce4035b41",
                    "size": 6153964,
                    "url": "https://piston-data.mojang.com/"
                }
            },
            "id": "1.20",
            "javaVersion": {
                "component": "java-runtime-gamma",
                "majorVersion": 17
            },
            "libraries": [
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1.jar",
                            "sha1": "ae58664f88e18a9bb2c77b063833ca7aaec484cb",
                            "size": 724243,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1"
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-linux.jar",
                            "sha1": "1de885aba434f934201b99f2f1afb142036ac189",
                            "size": 110704,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-linux.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-linux",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "linux"
                            }
                        }
                    ]
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-macos.jar",
                            "sha1": "fc6bb723dec2cd031557dccb2a95f0ab80acb9db",
                            "size": 55706,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-macos.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-macos",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "osx"
                            }
                        }
                    ]
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-macos-arm64.jar",
                            "sha1": "71d0d5e469c9c95351eb949064497e3391616ac9",
                            "size": 42693,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-macos-arm64.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-macos-arm64",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "osx"
                            }
                        }
                    ]
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows.jar",
                            "sha1": "0036c37f16ab611b3aa11f3bcf80b1d509b4ce6b",
                            "size": 159361,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-windows",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "windows"
                            }
                        }
                    ]
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-arm64.jar",
                            "sha1": "0f46cadcf95675908fd3a550d63d9d709cb68998",
                            "size": 130064,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-arm64.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-windows-arm64",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "windows"
                            }
                        }
                    ]
                },
                {
                    "downloads": {
                        "artifact": {
                            "path": "org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-x86.jar",
                            "sha1": "3b14f4beae9dd39791ec9e12190a9380cd8a3ce6",
                            "size": 134695,
                            "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.1/lwjgl-3.3.1-natives-windows-x86.jar"
                        }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.1:natives-windows-x86",
                    "rules": [
                        {
                            "action": "allow",
                            "os": {
                                "name": "windows"
                            }
                        }
                    ]
                }
            ],
            "logging": {
                "client": {
                    "argument": "-Dlog4j.configurationFile=${path}",
                    "file": {
                        "id": "client-1.12.xml",
                        "sha1": "bd65e7d2e3c237be76cfbef4c2405033d7f91521",
                        "size": 888,
                        "url": "https://piston-data.mojang.com/v1/objects/bd65e7d2e3c237be76cfbef4c2405033d7f91521/client-1.12.xml"
                    },
                    "type": "log4j2-xml"
                }
            },
            "mainClass": "net.minecraft.client.main.Main",
            "minimumLauncherVersion": 21,
            "releaseTime": "2023-06-02T08:36:17+00:00",
            "time": "2023-06-02T08:36:17+00:00",
            "type": "release"
        })).expect("failed to parse")
    }

    fn get_manifest_two() -> Manifest {
        serde_json::from_value::<Manifest>(serde_json::json!({
            "id": "neoforge-20.2.93",
            "time": "2025-04-21T18:38:04.10748185",
            "releaseTime": "2025-04-21T18:38:04.10748185",
            "type": "release",
            "mainClass": "cpw.mods.bootstraplauncher.BootstrapLauncher",
            "inheritsFrom": "1.20.2",
            "arguments": {
                "game": [
                    "--fml.neoForgeVersion",
                    "20.2.93",
                    "--fml.fmlVersion",
                    "1.0.16",
                    "--fml.mcVersion",
                    "1.20.2",
                    "--fml.neoFormVersion",
                    "20231019.002635",
                    "--launchTarget",
                    "forgeclient"
                ],
                "jvm": [
                    "-Djava.net.preferIPv6Addresses=system",
                    "-DignoreList=securejarhandler-2.1.24.jar,asm-9.5.jar,asm-commons-9.5.jar,asm-tree-9.5.jar,asm-util-9.5.jar,asm-analysis-9.5.jar,bootstraplauncher-1.1.2.jar,JarJarFileSystems-0.4.0.jar,events-1.0.16.jar,core-1.0.16.jar,language-java-1.0.16.jar,language-lowcode-1.0.16.jar,language-minecraft-1.0.16.jar,client-extra,neoforge-,${version_name}.jar",
                    "-DmergeModules=jna-5.10.0.jar,jna-platform-5.10.0.jar",
                    "-Dfml.pluginLayerLibraries=core-1.0.16.jar,language-java-1.0.16.jar,language-lowcode-1.0.16.jar,language-minecraft-1.0.16.jar",
                    "-Dfml.gameLayerLibraries=events-1.0.16.jar",
                    "-DlibraryDirectory=${library_directory}",
                    "-p",
                    "${library_directory}/cpw/mods/securejarhandler/2.1.24/securejarhandler-2.1.24.jar${classpath_separator}${library_directory}/org/ow2/asm/asm/9.5/asm-9.5.jar${classpath_separator}${library_directory}/org/ow2/asm/asm-commons/9.5/asm-commons-9.5.jar${classpath_separator}${library_directory}/org/ow2/asm/asm-tree/9.5/asm-tree-9.5.jar${classpath_separator}${library_directory}/org/ow2/asm/asm-util/9.5/asm-util-9.5.jar${classpath_separator}${library_directory}/org/ow2/asm/asm-analysis/9.5/asm-analysis-9.5.jar${classpath_separator}${library_directory}/cpw/mods/bootstraplauncher/1.1.2/bootstraplauncher-1.1.2.jar${classpath_separator}${library_directory}/net/neoforged/JarJarFileSystems/0.4.0/JarJarFileSystems-0.4.0.jar",
                    "--add-modules",
                    "ALL-MODULE-PATH",
                    "--add-opens",
                    "java.base/java.util.jar=cpw.mods.securejarhandler",
                    "--add-opens",
                    "java.base/java.lang.invoke=cpw.mods.securejarhandler",
                    "--add-exports",
                    "java.base/sun.security.util=cpw.mods.securejarhandler",
                    "--add-exports",
                    "jdk.naming.dns/com.sun.jndi.dns=java.naming"
                ]
            },
            "libraries": [
                {
                    "name": "net.neoforged.fancymodloader:earlydisplay:1.0.16@jar",
                    "downloads": {
                        "artifact": {
                            "sha1": "8d0077997d17a487cf655aff977ca2d3d3f04739",
                            "size": 260143,
                            "url": "",
                            "path": "net/neoforged/fancymodloader/earlydisplay/1.0.16/earlydisplay-1.0.16.jar"
                        }
                    }
                },
                {
                    "name": "net.neoforged.fancymodloader:core:1.0.16@jar",
                    "downloads": {
                        "artifact": {
                            "sha1": "6bab0913ca1635a8e272ef89c17befb52115a3c2",
                            "size": 117585,
                            "url": "",
                            "path": "net/neoforged/fancymodloader/core/1.0.16/core-1.0.16.jar"
                        }
                    }
                }
            ]
        })).expect("failed to parse")
    }

    #[test]
    fn test_inherit() {
        let manfest_one = get_manifest_one();
        let manifest_two = get_manifest_two();

        let merge = manfest_one.inherit(manifest_two).expect("failed to merge");

        println!("{:#?}", merge);
    }

    #[test]
    fn test_as_classpath() {
        let manfiest = get_manifest_one();

        let temp = std::path::PathBuf::from_str("C:\\").expect("failed to build path");

        let classpath = manfiest
            .as_classpath(&temp, "1.20")
            .expect("failed to build");

        assert!(classpath.contains("1.20.jar"));
        assert!(classpath.contains("lwjgl-3.3.1.jar"));

        if cfg!(target_os = "windows") {
            assert!(classpath.contains("lwjgl-3.3.1-natives-windows.jar"));
            assert!(classpath.contains("lwjgl-3.3.1-natives-windows-x86.jar"));
            assert!(classpath.contains("lwjgl-3.3.1-natives-windows-arm64.jar"));

            assert!(!classpath.contains("lwjgl-3.3.1-natives-linux.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-macos.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-macos-arm64.jar"));
        } else if cfg!(target_os = "macos") {
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows-x86.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows-arm64.jar"));

            assert!(!classpath.contains("lwjgl-3.3.1-natives-linux.jar"));
            assert!(classpath.contains("lwjgl-3.3.1-natives-macos.jar"));
            assert!(classpath.contains("lwjgl-3.3.1-natives-macos-arm64.jar"));
        } else {
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows-x86.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-windows-arm64.jar"));

            assert!(classpath.contains("lwjgl-3.3.1-natives-linux.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-macos.jar"));
            assert!(!classpath.contains("lwjgl-3.3.1-natives-macos-arm64.jar"));
        }

        println!("Classpath: {:#?}", classpath);
    }

    #[test]
    fn test_dedup_library() {
        init();
        let manifset_source: Manifest = serde_json::from_str(r#"{
        "inheritsFrom": "1.21.4",
        "releaseTime": "2024-12-25T08:28:30+0000",
        "mainClass": "net.fabricmc.loader.impl.launch.knot.KnotClient",
        "libraries": [
            {
                "sha1": "f0ed132a49244b042cd0e15702ab9f2ce3cc8436",
                "sha256": "8cadd43ac5eb6d09de05faecca38b917a040bb9139c7edeb4cc81c740b713281",
                "size": 126093,
                "name": "org.ow2.asm:asm:9.7",
                "sha512": "4767b01603dad5c79cc1e2b5f3722f72b1059d928f184f446ba11badeb1b381b3a3a9a801cc43d25d396df950b09d19597c73173c411b1da890de808b94f1f50",
                "url": "https://maven.fabricmc.net/",
                "md5": "e2cdd32d198ad31427d298eee9d39d8d"
            },
            {
                "name": "net.fabricmc:intermediary:1.21.4",
                "url": "https://maven.fabricmc.net/"
            },
            {
                "name": "net.fabricmc:fabric-loader:0.16.9",
                "url": "https://maven.fabricmc.net/"
            }
        ],
        "arguments": {
            "jvm": [
                "-DFabricMcEmu= net.minecraft.client.main.Main "
            ],
            "game": []
        },
        "id": "fabric-loader-0.16.9-1.21.4",
        "time": "2024-12-25T08:28:30+0000",
        "type": "release"
    }"#).expect("Failed to parse manifset");
        let manifset_two: Manifest = serde_json::from_str(r#"
        {
                "releaseTime": "2024-12-25T08:28:30+0000",
                "mainClass": "net.fabricmc.loader.impl.launch.knot.KnotClient",
                "libraries": [
                    {
                        "downloads": {
                            "artifact": {
                                "path": "org/ow2/asm/asm/9.6/asm-9.6.jar",
                                "sha1": "aa205cf0a06dbd8e04ece91c0b37c3f5d567546a",
                                "size": 123598,
                                "url": "https://libraries.minecraft.net/org/ow2/asm/asm/9.6/asm-9.6.jar"
                            }
                        },
                        "name": "org.ow2.asm:asm:9.6"
                    }
                ],
                "arguments": {
                    "jvm": [
                        "-DFabricMcEmu= net.minecraft.client.main.Main "
                    ],
                    "game": []
                },
                "id": "fabric-loader-0.16.9-1.21.4",
                "time": "2024-12-25T08:28:30+0000",
                "type": "release"
            }
        "#).expect("Failed to parse");

        let updated = manifset_two
            .inherit(manifset_source)
            .expect("Failed to inherit");
        log::debug!("{:#?}", updated);

        assert!(updated.libraries.len() == 3)
    }

    #[test]
    fn test_duplicate_same_libs() {
        init();
        let manifset_source: Manifest = serde_json::from_str(
            r#"{
        "inheritsFrom": "1.21.4",
        "releaseTime": "2024-12-25T08:28:30+0000",
        "mainClass": "net.fabricmc.loader.impl.launch.knot.KnotClient",
        "libraries": [
            {
                "name": "com.google.code.gson:gson:2.11.0",
                "downloads": {
                    "artifact": {
                    "sha1": "527175ca6d81050b53bdd4c457a6d6e017626b0e",
                    "size": 298435,
                    "url": "https://libraries.minecraft.net/com/google/code/gson/gson/2.11.0/gson-2.11.0.jar",
                    "path": "com/google/code/gson/gson/2.11.0/gson-2.11.0.jar"
                    }
                }
            }
        ],
        "arguments": {
            "jvm": [
                "-DFabricMcEmu= net.minecraft.client.main.Main "
            ],
            "game": []
        },
        "id": "fabric-loader-0.16.9-1.21.4",
        "time": "2024-12-25T08:28:30+0000",
        "type": "release"
    }"#,
        )
        .expect("Failed to parse manifset");
        let manifset_two: Manifest = serde_json::from_str(r#"
        {
                "releaseTime": "2024-12-25T08:28:30+0000",
                "mainClass": "net.fabricmc.loader.impl.launch.knot.KnotClient",
                "libraries": [
                     {
                        "downloads": {
                            "artifact": {
                                "path": "com/google/code/gson/gson/2.11.0/gson-2.11.0.jar",
                                "sha1": "527175ca6d81050b53bdd4c457a6d6e017626b0e",
                                "size": 298435,
                                "url": "https://libraries.minecraft.net/com/google/code/gson/gson/2.11.0/gson-2.11.0.jar"
                            }
                        },
                        "name": "com.google.code.gson:gson:2.11.0"
                    }
                ],
                "arguments": {
                    "jvm": [
                        "-DFabricMcEmu= net.minecraft.client.main.Main "
                    ],
                    "game": []
                },
                "id": "fabric-loader-0.16.9-1.21.4",
                "time": "2024-12-25T08:28:30+0000",
                "type": "release"
            }
        "#).expect("Failed to parse");

        let updated = manifset_two
            .inherit(manifset_source)
            .expect("Failed to inherit");
        log::debug!("{:#?}", updated);

        assert!(updated.libraries.len() == 1)
    }
}
