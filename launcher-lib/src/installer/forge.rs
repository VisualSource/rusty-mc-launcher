use super::{
    compression::extract_file_to,
    download_libraries,
    utils::{event_internal, ChannelMessage},
};
use futures::TryFutureExt;
use log::info;
use normalize_path::NormalizePath;
use std::{collections::HashMap, path::Path};

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
    server: String,
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
            Ok(self.client.to_string())
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

    pub fn get_args(&self, mappings: &[(String, String)]) -> Result<Vec<String>, LauncherError> {
        let mut args = Vec::new();

        for arg in &self.args {
            if arg.starts_with('{') && arg.ends_with('}') {
                let mapping =
                    mappings
                        .iter()
                        .find(|x| &x.0 == arg)
                        .ok_or(LauncherError::NotFound(format!(
                            "Failed to find mapping for: {}",
                            arg
                        )))?;
                args.push(mapping.1.to_owned());
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
    ) -> Result<(), LauncherError> {
        let library_directory = runtime_directory.join("libraries");
        let vanilla_jar = runtime_directory
            .join("versions")
            .join(&self.minecraft)
            .join(format!("{}.jar", &self.minecraft))
            .normalize();

        let mut mappings = self.get_mappings(&library_directory)?;
        mappings.push((
            "{MINECRAFT_JAR}".to_string(),
            vanilla_jar.to_string_lossy().to_string(),
        ));
        mappings.push((
            "{INSTALLER}".to_string(),
            installer_path.to_string_lossy().to_string(),
        ));
        mappings.push(("{BINPATCH}".to_string(), lzma.to_string_lossy().to_string()));
        mappings.push((
            "{ROOT}".to_string(),
            std::env::temp_dir().to_string_lossy().to_string(),
        ));
        mappings.push(("{SIDE}".to_string(), "client".to_string()));

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

            let args = processor.get_args(&mappings)?;

            let command = tokio::process::Command::new(java)
                .arg("-cp")
                .arg(classpath)
                .arg(main_class)
                .args(&args)
                .output()
                .await?;

            info!("{}", String::from_utf8_lossy(&command.stdout));
        }

        Ok(())
    }
}

pub async fn get_latest_version(minecraft_version: &str) -> Result<String, LauncherError> {
    let regex = regex::Regex::new(&format!(
        r"<version>{minecraft_version}-(?<loader_version>\d+\.\d+\.\d+)</version>"
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

    let forge_download_url = format!(
        "https://maven.minecraftforge.net/net/minecraftforge/forge/{0}/forge-{0}-installer.jar",
        forge_version
    );

    let temp = std::env::temp_dir();
    let installer_path = temp.join(format!("installer-forge-{}.jar", forge_version));
    // archive life time
    let (profile, modded_manifest_path) = {
        utils::download_file(&forge_download_url, &installer_path, None, None).await?;

        let mut archive = open_archive(File::open(&installer_path).await?).await?;
        let profile =
            compression::parse_extract::<InstallProfile>(&mut archive, "install_profile.json")
                .await?;

        download_libraries(
            event_channel,
            runtime_directory,
            &profile.version,
            profile.libraries.to_owned(),
        )
        .await?;

        let version_directory = runtime_directory.join("versions").join(&profile.version);
        let modded_manifest_path = version_directory.join(format!("{}.json", &profile.version));
        let libraries_directory = runtime_directory.join("libraries");

        extract_file_to(&mut archive, "version.json", &version_directory).await?;

        fs::rename(
            version_directory.join("version.json"),
            &modded_manifest_path,
        )
        .await?;

        compression::extract_dir(&mut archive, "maven", &libraries_directory).await?;
        compression::extract_file_to(&mut archive, "client.lzma", &temp).await?;

        (profile, modded_manifest_path)
    };

    let manifest = Manifest::read_manifest(&modded_manifest_path, false).await?;

    download_libraries(
        event_channel,
        runtime_directory,
        &manifest.id,
        manifest.libraries,
    )
    .await?;

    // fs::copy(vanilla_jar, &modded_jar).await?;

    let lzma_path = temp.join("data/client.lzma").normalize();
    // run processors
    profile
        .run_client_processors(&lzma_path, &installer_path, runtime_directory, java)
        .await?;

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

    #[tokio::test]
    async fn test_forge_install() {
        let runtime_dir = std::env::temp_dir().join("runtime");

        /*run_installer("1.20.6", None, &runtime_dir, "")
        .await
        .expect("Failed to install");*/
    }

    #[tokio::test]
    async fn test_get_latest() {
        let version = get_latest_version("1.20.4")
            .await
            .expect("Failed to get result");

        assert_eq!("49.0.50", &version);
    }
}
