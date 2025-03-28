use super::{compression, utils};
use crate::error::{Error, Result};
use crate::events::DownloadEvent;
use crate::java::check_java;
use crate::manifest::{self, Downloads, Library, asset_index::AssetIndex};
use futures::StreamExt;
use log::{info, warn};

use normalize_path::NormalizePath;
use serde::Deserialize;
use std::path::PathBuf;
use tokio::fs::read_dir;
use tokio::{fs, io::AsyncWriteExt};

const JAVA_DOWNLOAD_URL: &str = "https://api.azul.com/metadata/v1/zulu/packages";

#[derive(Debug, Deserialize)]
struct JavaDownload {
    download_url: String,
    name: String,
    java_version: Vec<usize>,
}

/// Downloads the zulu jre
pub async fn download_java(
    runtime_directory: &std::path::Path,
    java: usize,
) -> Result<(String, PathBuf)> {
    let java_directory = runtime_directory.join("java").normalize();

    let temp = std::env::temp_dir();

    let url = &format!(
        "{}?arch={}&java_version={}&os={}&archive_type=zip&javafx_bundled=false&java_package_type=jre&page_size=1",
        JAVA_DOWNLOAD_URL,
        std::env::consts::ARCH,
        java,
        std::env::consts::OS
    );

    let request = utils::REQUEST_CLIENT.get(url);

    let response = request.send().await?;

    let result = response.json::<Vec<JavaDownload>>().await?;
    let java_download = result.first().ok_or(Error::NotFound(
        "The required java version was not found".to_string(),
    ))?;

    let java_vesrion = java_download
        .java_version
        .iter()
        .map(|e| e.to_string())
        .collect::<Vec<String>>()
        .join(".");

    let temp_file = temp.join(&java_download.name);

    let mut jrep = utils::REQUEST_CLIENT
        .get(&java_download.download_url)
        .send()
        .await?;

    if temp_file.exists() {
        fs::remove_file(&temp_file).await?;
    }

    let mut file = tokio::fs::OpenOptions::new()
        .create(true)
        .truncate(false)
        .read(true)
        .write(true)
        .create_new(true)
        .open(&temp_file)
        .await?;

    while let Some(mut chunk) = jrep.chunk().await? {
        file.write_all_buf(&mut chunk).await?;
    }

    file.sync_data().await?;

    let mut archive = compression::open_archive(file).await?;

    compression::extract_all(&mut archive, &java_directory).await?;

    fs::remove_file(temp_file).await?;

    let java = java_directory
        .join(java_download.name.replace(".zip", ""))
        .join("bin")
        .join("javaw.exe")
        .normalize();

    let test_java = check_java(&java)
        .await?
        .ok_or_else(|| Error::Generic("Java install check failed.".to_string()))?;

    if !test_java.starts_with(&java_vesrion) {
        return Err(Error::Generic(format!(
            "Java version returned was not what was expected. Found '{}' was expecting '{}'",
            test_java, java_vesrion
        )));
    }

    Ok((java_vesrion, java))
}

/// Downloads the minecraft client jar file
///
/// Emits: 2 Progress event
pub async fn download_client(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    version: &str,
    versions_directory: &std::path::Path,
    downloads: Option<Downloads>,
) -> Result<()> {
    let downloads = downloads.ok_or(Error::NotFound(
        "Client jar downloads section is missing!".to_string(),
    ))?;

    let client_jar = versions_directory
        .join(format!("{}.jar", version))
        .normalize();
    info!("Client jar file path: {}", client_jar.to_string_lossy());

    utils::download_file(
        &downloads.client.url,
        &client_jar,
        None,
        Some(&downloads.client.sha1),
    )
    .await?;

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}

/// download minecraft libraries that are defined in the
/// minecraft manifest file
///
/// Emits: 1 Progress event
pub async fn download_libraries(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    runtime_directory: &std::path::Path,
    version: &str,
    libraries: Vec<Library>,
) -> Result<()> {
    let library_directory = runtime_directory.join("libraries");
    let natvies_directory = runtime_directory.join("natives").join(version);

    let installed = futures::stream::iter(libraries.into_iter().map(|lib| {
        let lib_dir = library_directory.clone();
        let nat_dir = natvies_directory.clone();
        async move {
            if let Some(rules) = lib.rules {
                let allow = rules
                    .iter()
                    .all(|condition| condition.parse(None).unwrap_or(false));
                if !allow {
                    return Ok(());
                }
            }
            let artifact_name = lib.name.as_string();
            let artifact_path = lib.name.as_classpath();
            let path = lib_dir.join(&artifact_path).normalize();

            match &lib.downloads {
                Some(downloads) => {
                    if !downloads.artifact.url.is_empty() {
                        utils::download_file(
                            &downloads.artifact.url,
                            &path,
                            None,
                            Some(&downloads.artifact.sha1),
                        )
                        .await?;
                    } else {
                        warn!(
                            "Lib {} does not have a download url! Most likely a forge library.",
                            artifact_name
                        );
                    }
                }
                None => {
                    let url = format!(
                        "{}{}",
                        &lib.url
                            .unwrap_or("https://libraries.minecraft.net/".to_string()),
                        &artifact_path
                    );
                    utils::download_file(&url, &path, None, lib.sha1.as_deref()).await?;
                }
            }

            if let Some(natives) = &lib.natives {
                let os = std::env::consts::OS.replace("macos", "osx");

                if let Some(native) = natives.get(&os) {
                    let downloads = lib
                        .downloads
                        .ok_or(Error::NotFound("Failed to get downloads".to_owned()))?;
                    let classifiers = downloads
                        .classifiers
                        .ok_or(Error::NotFound("Failed to get classifer".to_string()))?;
                    let classifier = classifiers.get(native).ok_or(Error::NotFound(format!(
                        "Failed to get native for library: {}",
                        artifact_name
                    )))?;

                    let file = classifier
                        .url
                        .split('/')
                        .last()
                        .ok_or(Error::Generic("Failed to get file name".to_string()))?;
                    let temp = std::env::temp_dir();
                    let path = temp.join(file).normalize();

                    utils::download_file(&classifier.url, &path, None, Some(&classifier.sha1))
                        .await?;

                    let mut archive =
                        compression::open_archive(fs::File::open(&path).await?).await?;

                    compression::extract_all(&mut archive, &nat_dir).await?;

                    fs::remove_file(&path).await?;
                }
            }

            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<()>>>()
    .await;

    if installed.iter().any(|e| e.is_err()) {
        installed.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(Error::Generic("Failed to download libraries".to_string()));
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}

/// Downloads minecraft asset index files
///
/// Emits: 1 Progress event
pub async fn download_assets(
    on_event: &tauri::ipc::Channel<DownloadEvent>,
    runtime_directory: &std::path::Path,
    assets_index: Option<manifest::File>,
) -> Result<()> {
    let assets_index =
        assets_index.ok_or(Error::NotFound("Asset Index was not found".to_string()))?;

    let assets_objects_directory = runtime_directory.join("assets/objects");
    let assets_index_path = runtime_directory
        .join(format!(
            "assets/indexes/{}.json",
            assets_index
                .id
                .ok_or(Error::NotFound("Failed to get assets version".to_string()))?
        ))
        .normalize();

    utils::download_file(
        &assets_index.url,
        &assets_index_path,
        None,
        Some(&assets_index.sha1),
    )
    .await?;

    let file = fs::File::open(assets_index_path)
        .await?
        .try_into_std()
        .map_err(|_| Error::Generic("Failed to convert".to_string()))?;

    let mut reader = std::io::BufReader::new(file);

    let asset_manifest: AssetIndex = serde_json::from_reader(&mut reader)?;

    let assets = futures::stream::iter(asset_manifest.objects.into_iter().map(|(key, asset)| {
        let root = assets_objects_directory.clone();
        async move {
            info!("Fetching asset: {}", key);

            let hash = format!(
                "{}/{}",
                asset
                    .hash
                    .get(0..2)
                    .ok_or(Error::Generic("Failed to get hash id".to_string()))?,
                asset.hash
            );

            let file_path = root.join(&hash).normalize();

            let url = format!("https://resources.download.minecraft.net/{}", hash);

            utils::download_file(&url, &file_path, None, Some(&asset.hash)).await?;
            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<()>>>()
    .await;

    if assets.iter().any(|e| e.is_err()) {
        assets.iter().for_each(|e| {
            if let Err(err) = e {
                log::error!("{}", err)
            }
        });
        return Err(Error::Generic("Failed to download assets".to_string()));
    }

    on_event
        .send(crate::events::DownloadEvent::Progress {
            amount: Some(2),
            message: None,
        })
        .map_err(|err| Error::Generic(err.to_string()))?;

    Ok(())
}
