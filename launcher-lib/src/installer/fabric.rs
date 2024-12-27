use crate::{
    error::{Error, Result},
    events::DownloadEvent,
    installer::fabric_core,
};
use normalize_path::NormalizePath;
use std::path::Path;

const FABRIC_LOADER_VERSION_LIST_URL: &str = "https://meta.fabricmc.net/v2/versions/loader";
const FABRIC_INSTALLER_LIST_URL: &str =
    "https://maven.fabricmc.net/net/fabricmc/fabric-installer/maven-metadata.xml";
const FABRIC_INSTALLER_DOWNLOAD_URL: &str =
    "https://maven.fabricmc.net/net/fabricmc/fabric-installer/";

/// Install the fabric or quilt mod loader.
pub async fn run_installer(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    runtime_directory: &Path,
    java: &str,
    version: &str,
    loader_version: Option<String>,
) -> Result<String> {
    let vanilla_jar = runtime_directory
        .join("versions")
        .join(version)
        .join(format!("{}.jar", version))
        .normalize();

    let loader_version = if let Some(version) = loader_version {
        version
    } else {
        fabric_core::get_latest_loader_version(FABRIC_LOADER_VERSION_LIST_URL).await?
    };
    let installer_version = fabric_core::get_latest_installer(FABRIC_INSTALLER_LIST_URL).await?;
    let installer_url = format!(
        "{0}{1}/fabric-installer-{1}.jar",
        FABRIC_INSTALLER_DOWNLOAD_URL, installer_version
    );

    let modded_version = format!("fabric-loader-{}-{}", loader_version, version);
    let install_args = vec![
        "client",
        "-dir",
        runtime_directory
            .to_str()
            .ok_or_else(|| Error::Generic("Failed to get string".to_string()))?,
        "-mcversion",
        version,
        "-loader",
        &loader_version,
        "-noprofile",
        "-snapshot",
    ];

    fabric_core::run_fabric_like_installer(
        &installer_url,
        install_args,
        &modded_version,
        &vanilla_jar,
        runtime_directory,
        java,
        on_event,
    )
    .await?;

    Ok(loader_version)
}
