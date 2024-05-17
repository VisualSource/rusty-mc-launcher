use super::{download_libraries, utils::ChannelMessage};
use log::info;
use normalize_path::NormalizePath;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};

use serde::Deserialize;
use tokio::{
    fs::{self, File},
    sync::mpsc,
};

use crate::{
    errors::LauncherError,
    manifest::{Library, Manifest},
};

use super::{
    compression::{self, open_archive},
    utils,
};
#[derive(Debug, Deserialize)]
struct Mapping {
    client: String,
    //server: String,
}
impl Mapping {
    fn get_client(&self, libary_path: &Path) -> Result<String, LauncherError> {
        if self.client.starts_with('[') && self.client.ends_with(']') {
            Ok(libary_path
                .join(Library::get_artifact_path(
                    &self.client.replace(['[', ']'], ""),
                )?)
                .normalize()
                .to_string_lossy()
                .to_string())
        } else {
            Ok(self.client.replace('\'', ""))
        }
    }
}

#[derive(Debug, Deserialize)]
struct Processor {
    sides: Option<Vec<String>>,
    jar: String,
    classpath: Vec<String>,
    args: Vec<String>,
    outputs: Option<HashMap<String, String>>,
}

impl Processor {
    fn is_client(&self) -> bool {
        match &self.sides {
            None => true,
            Some(sides) => sides.contains(&"client".to_string()),
        }
    }

    pub fn get_args(
        &self,
        mappings: &[(String, String)],
        library_directory: &Path,
    ) -> Result<Vec<String>, LauncherError> {
        let mut args = Vec::new();

        for arg in &self.args {
            if arg.starts_with('{') && arg.ends_with('}') {
                let mapping = mappings
                    .iter()
                    .find(|x| x.0 == arg.replace(['{', '}'], ""))
                    .ok_or(LauncherError::NotFound(format!(
                        "Failed to find mapping for: {}",
                        arg
                    )))?;
                args.push(mapping.1.to_owned());
            } else if arg.starts_with('[') && arg.ends_with(']') {
                let path = Library::get_artifact_path(&arg.replace(['[', ']'], ""))?;

                args.push(
                    library_directory
                        .join(path)
                        .normalize()
                        .to_string_lossy()
                        .to_string(),
                );
            } else {
                args.push(arg.to_owned());
            }
        }

        Ok(args)
    }
}
#[derive(Debug, Deserialize)]
struct InstallProfile {
    path: String,
    version: String,
    minecraft: String,
    data: HashMap<String, Mapping>,
    processors: Vec<Processor>,
    libraries: Vec<Library>,
}

impl InstallProfile {
    fn get_mappings(
        &self,
        library_directory: &Path,
    ) -> Result<Vec<(String, String)>, LauncherError> {
        let mut mappings = Vec::new();

        for (key, mapping) in &self.data {
            if key == "BINPATCH" {
                continue;
            }

            let arg = mapping.get_client(library_directory)?;
            mappings.push((key.to_string(), arg))
        }

        Ok(mappings)
    }

    pub async fn run_client_processors(
        &self,
        lzma: &Path,
        installer_path: &Path,
        runtime_directory: &Path,
        java: &str,
    ) -> Result<PathBuf, LauncherError> {
        let library_directory = runtime_directory.join("libraries");
        let vanilla_jar = runtime_directory
            .join("versions")
            .join(&self.minecraft)
            .join(format!("{}.jar", &self.minecraft))
            .normalize();

        let mut mappings = self.get_mappings(&library_directory)?;
        mappings.push((
            "MINECRAFT_JAR".to_string(),
            vanilla_jar.to_string_lossy().to_string(),
        ));
        mappings.push((
            "INSTALLER".to_string(),
            installer_path.to_string_lossy().to_string(),
        ));
        mappings.push(("BINPATCH".to_string(), lzma.to_string_lossy().to_string()));
        mappings.push(("SIDE".to_string(), "client".to_string()));

        let processors = self.processors.iter().filter(|x| x.is_client());

        let library_directory = runtime_directory.join("libraries");

        for processor in processors {
            let mut classpath = Vec::new();
            for lib in &processor.classpath {
                classpath.push(
                    library_directory
                        .join(Library::get_artifact_path(lib)?)
                        .normalize()
                        .to_string_lossy()
                        .to_string(),
                );
            }

            let main_jar = library_directory
                .join(Library::get_artifact_path(&processor.jar)?)
                .normalize();

            classpath.push(main_jar.to_string_lossy().to_string());

            let classpath = classpath.join(Library::get_class_sep());

            let main_class = compression::get_mainclass(&main_jar).await?;

            let args = processor.get_args(&mappings, &library_directory)?;

            let command = tokio::process::Command::new(java)
                .arg("-cp")
                .arg(classpath)
                .arg(main_class)
                .args(&args)
                .output()
                .await?;

            info!("{}", String::from_utf8_lossy(&command.stdout));
        }

        Ok(vanilla_jar)
    }
}

pub async fn get_latest_version(minecraft_version: &str) -> Result<String, LauncherError> {
    let regex = regex::Regex::new(&format!(
        r"<version>{minecraft_version}-(?<loader_version>\d+\.\d+\.\d+)<\/version>"
    ))?;

    let response = utils::REQUEST_CLIENT
        .get("https://maven.minecraftforge.net/net/minecraftforge/forge/maven-metadata.xml")
        .send()
        .await?;

    let data = response.text().await?;

    let cap = regex.captures(&data).ok_or(LauncherError::NotFound(
        "Failed to find capture".to_string(),
    ))?;

    let loader_version = cap.name("loader_version").ok_or(LauncherError::NotFound(
        "Failed to get loader_version".to_string(),
    ))?;

    Ok(loader_version.as_str().to_string())
}

pub async fn run_installer(
    event_channel: &mpsc::Sender<ChannelMessage>,
    version: &str,
    loader_verison: Option<String>,
    runtime_directory: &Path,
    java: &str,
) -> Result<(), LauncherError> {
    let loader_version = if let Some(loader) = loader_verison {
        loader
    } else {
        get_latest_version(version).await?
    };

    let forge_version = format!("{}-{}", version, loader_version);

    info!("Using forge version {}", forge_version);

    let forge_download_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{0}/forge-{0}-installer.jar",
        forge_version
    );

    let temp = std::env::temp_dir();
    let installer_path = temp.join(format!("installer-forge-{}.jar", forge_version));
    // archive life time
    let (profile, modded_manifest_path) = {
        if installer_path.exists() && installer_path.is_file() {
            fs::remove_file(&installer_path).await?;
        }

        utils::download_file(&forge_download_url, &installer_path, None, None).await?;

        info!("Extracting and parseing install_profile");
        let mut archive = open_archive(File::open(&installer_path).await?).await?;
        let profile =
            compression::parse_extract::<InstallProfile>(&mut archive, "install_profile.json")
                .await?;

        let version_directory = runtime_directory.join("versions").join(&profile.version);
        let modded_manifest_path = version_directory.join(format!("{}.json", &profile.version));

        info!("Extracting version.json");
        // extract version manifest and rename
        compression::extract_file_to(&mut archive, "version.json", &version_directory).await?;

        fs::rename(
            version_directory.join("version.json"),
            &modded_manifest_path,
        )
        .await?;

        info!("Extracting files from dir");
        // extract libs in installer jar
        let libraries_directory = runtime_directory.join("libraries");
        compression::extract_dir(
            &mut archive,
            "maven",
            &libraries_directory,
            Some(|filepath| filepath.replace("maven", "")),
        )
        .await?;

        info!("Extract file client.lzma");
        // extract client.lzma
        compression::extract_file_to(&mut archive, "data/client.lzma", &temp).await?;

        (profile, modded_manifest_path)
    };

    let manifest = Manifest::read_manifest(&modded_manifest_path, false).await?;

    tokio::try_join! {
        // profile libraries
        download_libraries(
            event_channel,
            runtime_directory,
            &profile.version,
            profile.libraries.to_owned(),
        ),
        // manifest libraries
        download_libraries(
            event_channel,
            runtime_directory,
            &manifest.id,
            manifest.libraries,
        )
    }?;

    let lzma_path = temp.join("data/client.lzma").normalize();
    // run processors
    let vanilla_jar = profile
        .run_client_processors(&lzma_path, &installer_path, runtime_directory, java)
        .await?;

    let modded_jar = runtime_directory
        .join("versions")
        .join(&profile.version)
        .join(format!("{}.jar", &profile.version));
    let copyed = fs::copy(&vanilla_jar, &modded_jar).await?;

    info!(
        "Copyed {} to {} | {} bytes",
        vanilla_jar.to_string_lossy(),
        modded_jar.to_string_lossy(),
        copyed
    );

    fs::remove_file(&installer_path).await?;
    fs::remove_file(&lzma_path).await?;

    if let Some(parent) = lzma_path.parent() {
        fs::remove_dir(parent).await?;
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::Debug)
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_forge_install() {
        init();

        let runtime_dir = std::env::temp_dir().join("runtime");
        let (tx, _) = tokio::sync::mpsc::channel(2);
        let java = runtime_dir
            .join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\java.exe")
            .to_string_lossy()
            .to_string();
        run_installer(&tx, "1.20.6", None, &runtime_dir, &java)
            .await
            .expect("Failed to install forge");

        /*run_installer("1.20.6", None, &runtime_dir, "")
        .await
        .expect("Failed to install");*/
    }
    #[test]
    fn test_get_processer_args() {
        let processor = serde_json::from_str::<Processor>(
            r#"
        {
            "jar": "",
            "classpath": [],
            "args": [
                "--task",
                "MCP_DATA",
                "--input",
                "[de.oceanlabs.mcp:mcp_config:1.20.6-20240429.135109@zip]",
                "--output",
                "{MAPPINGS}",
                "--key",
                "mappings"
            ],
        }
        "#,
        )
        .expect("Failed to parse");

        let dir = std::env::temp_dir().join("libraries");

        let mappings = vec![("MAPPINGS".to_string(), "/EXAMPLE_PATH.trg".to_string())];

        let result = processor
            .get_args(&mappings, &dir)
            .expect("Failed to parse");

        println!("{:#?}", result);
    }

    #[test]
    fn test_get_mappings() {
        let a = serde_json::from_str::<InstallProfile>(
            r#"
        {
            "path": "net.minecraftforge:forge:1.20.6-50.0.20:shim",
            "processors": [],
            "libraries": [],
            "minecraft": "1.20.6",
            "version": "1.20.6-forge-50.0.20",
            "data": {
                "MAPPINGS": {
                    "client": "[de.oceanlabs.mcp:mcp_config:1.20.6-20240429.135109:mappings@tsrg]",
                    "server": "[de.oceanlabs.mcp:mcp_config:1.20.6-20240429.135109:mappings@tsrg]"
                },
                "MAPPINGS_SHA": {
                    "client": "'6f1298ce9eabba35559aab5378a7a9ffb693ba95'",
                    "server": "'6f1298ce9eabba35559aab5378a7a9ffb693ba95'"
                },
                "MOJMAPS": {
                    "client": "[net.minecraft:client:1.20.6:mappings@tsrg]",
                    "server": "[net.minecraft:server:1.20.6:mappings@tsrg]"
                },
                "MOJMAPS_SHA": {
                    "client": "'269c6b975e8731ae55c12caddecb257c6fe25a22'",
                    "server": "'95e69f71484eb41c48d18cd42d2478de4cb78510'"
                },
                "MC_UNPACKED": {
                    "client": "[net.minecraft:client:1.20.6]",
                    "server": "[net.minecraft:server:1.20.6:unpacked]"
                },
                "MC_UNPACKED_SHA": {
                    "client": "'05b6f1c6b46a29d6ea82b4e0d42190e42402030f'",
                    "server": "'04b1dd8b5704b0e0baa452f7b411a4b69af44b51'"
                },
                "MC_OFF": {
                    "client": "[net.minecraft:client:1.20.6:official]",
                    "server": "[net.minecraft:server:1.20.6:official]"
                },
                "MC_OFF_SHA": {
                    "client": "'547664b3b3906f53801eeb78b234431f56512409'",
                    "server": "'806cda7c01ab8e8d0e90050d7e4a4e7a16945711'"
                },
                "BINPATCH": {
                    "client": "/data/client.lzma",
                    "server": "/data/server.lzma"
                },
                "PATCHED": {
                    "client": "[net.minecraftforge:forge:1.20.6-50.0.20:client]",
                    "server": "[net.minecraftforge:forge:1.20.6-50.0.20:server]"
                },
                "PATCHED_SHA": {
                    "client": "'0e34b0d78fdca8747bdda3badb564339491a80c9'",
                    "server": "'45c82a01b66737bab7d9f40caa9e0a193f22e31c'"
                }
            }

        }
        "#,
        )
        .expect("Failed to parse");

        let temp = std::env::temp_dir();

        let mappings = a.get_mappings(&temp).expect("Failed to get mappings");

        println!("{:#?}", mappings);
    }

    #[tokio::test]
    async fn test_get_latest() {
        let version = get_latest_version("1.20.4")
            .await
            .expect("Failed to get result");

        assert_eq!("49.0.50", &version);
    }
}
