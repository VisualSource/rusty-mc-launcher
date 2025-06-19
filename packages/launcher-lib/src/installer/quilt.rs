use crate::{error::Result, events::DownloadEvent, installer::fabric_core};
use normalize_path::NormalizePath;
use std::path::Path;

const QUILT_LOADER_VERSION_LIST_URL: &str = "https://meta.quiltmc.org/v3/versions/loader";
const QUILT_INSTALLER_LIST_URL: &str =
    "https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/maven-metadata.xml";
const QUILT_INSTALLER_DOWNLOAD: &str =
    "https://maven.quiltmc.org/repository/release/org/quiltmc/quilt-installer/";

/// Install the quilt
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
        fabric_core::get_latest_loader_version(QUILT_LOADER_VERSION_LIST_URL).await?
    };
    let installer_version = fabric_core::get_latest_installer(QUILT_INSTALLER_LIST_URL).await?;
    let installer_url = format!(
        "{0}{1}/quilt-installer-{1}.jar",
        QUILT_INSTALLER_DOWNLOAD, installer_version
    );

    let dir = format!("--install-dir={}", runtime_directory.to_string_lossy());
    let modded_version = format!("quilt-loader-{}-{}", loader_version, version);
    let install_args = vec![
        "install",
        "client",
        version,
        &loader_version,
        &dir,
        "--no-profile",
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
