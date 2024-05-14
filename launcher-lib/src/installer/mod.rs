mod fabric;
mod metadata;
pub mod utils;
use std::path::PathBuf;

use crate::manifest;
use crate::manifest::asset_index::AssetIndex;
use crate::manifest::{Downloads, Library, Manifest};
use crate::{errors::LauncherError, state::AppState};
use async_zip::tokio::read::seek::ZipFileReader;
use futures::StreamExt;
use log::info;
use metadata::get_launcher_manifest;
use normalize_path::NormalizePath;
use serde::Deserialize;
use tokio::fs::{self, File, OpenOptions};
use tokio::io::AsyncWriteExt;
use tokio::sync::mpsc;
use tokio_util::compat::{TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};
use utils::ChannelMessage;

#[derive(Debug, Deserialize, PartialEq, Eq, PartialOrd, Ord)]
enum Loader {
    Vanilla,
    Forge,
    Fabric,
    Quilt,
    NeoForge,
}
impl Default for Loader {
    fn default() -> Self {
        Self::Vanilla
    }
}

#[derive(Debug, Deserialize)]
pub struct InstallConfig {
    app_directory: PathBuf,
    version: String,
    loader: Loader,
    loader_version: Option<String>,
}

pub async fn install_minecraft(
    app: &AppState,
    config: InstallConfig,
    event_channel: mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    // event!(&event_channel, "download", { "type": "status", "payload": { "message": "Starting minecraft install." } });

    let runtime_directory = config.app_directory.join("runtime");
    let version_directory = runtime_directory.join("versions").join(&config.version);

    let client_manfiest_file = version_directory
        .join(format!("{}.json", config.version))
        .normalize();

    if !(client_manfiest_file.exists() && client_manfiest_file.is_file()) {
        let launcher_manifest = get_launcher_manifest(Some(&config.version)).await?;
        utils::download_file(
            &launcher_manifest.url,
            &client_manfiest_file,
            None,
            Some(&launcher_manifest.sha1),
        )
        .await?;
    }

    let manifset = Manifest::read_manifest(&client_manfiest_file, false).await?;
    let java_version = manifset
        .java_version
        .ok_or(LauncherError::NotFound("Java not found".to_string()))?
        .major_version;

    let found_java = {
        let store = app.java.read().await;
        store.has(java_version)
    };

    if !found_java {
        let (build_version, path) =
            download_java(&event_channel, &runtime_directory, java_version).await?;

        let mut store = app.java.write().await;

        store.insert(java_version, build_version, path)?;
    }

    tokio::try_join! {
        download_client(&event_channel, &config.version, &version_directory, manifset.downloads),
        download_assets(&event_channel, &runtime_directory, manifset.asset_index),
        download_libraries(&event_channel,&runtime_directory,&config.version,manifset.libraries)
    }?;

    if config.loader != Loader::Vanilla {
        let java_exe = {
            let store = app.java.read().await;
            store
                .get(java_version)
                .ok_or(LauncherError::NotFound(
                    "Java executable was not found".to_string(),
                ))?
                .to_owned()
        };

        let modded_version = match config.loader {
            Loader::Vanilla => {
                return Err(LauncherError::Generic("Should not be here".to_string()))
            }
            Loader::Forge => unimplemented!(),
            Loader::Fabric => {
                fabric::run_installer(
                    &event_channel,
                    &runtime_directory,
                    &java_exe,
                    &config.version,
                    config.loader_version,
                    false,
                )
                .await?
            }
            Loader::Quilt => {
                fabric::run_installer(
                    &event_channel,
                    &runtime_directory,
                    &java_exe,
                    &config.version,
                    config.loader_version,
                    true,
                )
                .await?
            }
            Loader::NeoForge => unimplemented!(),
        };

        info!("{}", modded_version);

        let modded_directory = runtime_directory.join("versions").join(&modded_version);
        let modded_manifest = modded_directory.join(format!("{}.json", modded_version));
        let modded_jar = modded_directory.join(format!("{}.jar", modded_version));
        let vanilla_jar = version_directory.join(format!("{}.jar", config.version));

        if modded_jar.exists() && modded_jar.is_file() {
            fs::remove_file(&modded_jar).await?;
        }
        info!(
            "Copying {} to {}",
            vanilla_jar.to_string_lossy(),
            modded_jar.to_string_lossy()
        );
        fs::copy(vanilla_jar, modded_jar).await?;

        let mod_manifest = Manifest::read_manifest(&modded_manifest, false).await?;

        download_libraries(
            &event_channel,
            &runtime_directory,
            &modded_version,
            mod_manifest.libraries,
        )
        .await?;
    }

    Ok(())
}

#[derive(Debug, Deserialize)]
struct JavaDownload {
    download_url: String,
    name: String,
    java_version: Vec<usize>,
}
fn sanitize_file_path(path: &str) -> PathBuf {
    // Replaces backwards slashes
    path.replace('\\', "/")
        // Sanitizes each component
        .split('/')
        .map(sanitize_filename::sanitize)
        .collect()
}

async fn download_java(
    _event_channel: &mpsc::Sender<ChannelMessage>,
    runtime_directory: &std::path::Path,
    java: usize,
) -> Result<(String, PathBuf), LauncherError> {
    let java_directory = runtime_directory.join("java").normalize();

    let temp = std::env::temp_dir();

    let url = &format!("https://api.azul.com/metadata/v1/zulu/packages?arch={}&java_version={}&os={}&archive_type=zip&javafx_bundled=false&java_package_type=jre&page_size=1",std::env::consts::ARCH, java, std::env::consts::OS);

    let request = utils::REQUEST_CLIENT.get(url);

    let response = request.send().await?;

    let result = response.json::<Vec<JavaDownload>>().await?;
    let java_download = result.first().ok_or(LauncherError::NotFound(
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

    let archive = tokio::io::BufReader::new(file).compat();
    let mut reader = ZipFileReader::new(archive).await?;

    for index in 0..reader.file().entries().len() {
        let entry = reader
            .file()
            .entries()
            .get(index)
            .ok_or(LauncherError::Generic("Failed to get entry".to_string()))?;
        let path = java_directory.join(sanitize_file_path(entry.filename().as_str()?));

        let entry_is_dir = entry.dir()?;

        if entry_is_dir {
            if !path.exists() {
                fs::create_dir_all(&path).await?;
            }
        } else {
            let parent = path
                .parent()
                .ok_or(LauncherError::Generic("".to_string()))?;
            if !parent.is_dir() {
                fs::create_dir_all(parent).await?;
            }

            let mut entry_reader = reader.reader_without_entry(index).await?;
            let writer = OpenOptions::new()
                .write(true)
                .create_new(true)
                .open(&path)
                .await?;
            futures::io::copy(&mut entry_reader, &mut writer.compat_write()).await?;
        }
    }

    fs::remove_file(temp_file).await?;

    let java = java_directory
        .join(java_download.name.replace(".zip", ""))
        .join("bin")
        .join("javaw.exe")
        .normalize();

    Ok((java_vesrion, java))
}

async fn download_client(
    _event_channel: &mpsc::Sender<ChannelMessage>,
    version: &str,
    versions_directory: &std::path::Path,
    downloads: Option<Downloads>,
) -> Result<(), LauncherError> {
    let downloads = downloads.ok_or(LauncherError::NotFound(
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

    Ok(())
}

async fn download_libraries(
    _event_channel: &mpsc::Sender<ChannelMessage>,
    runtime_directory: &std::path::Path,
    version: &str,
    libraries: Vec<Library>,
) -> Result<(), LauncherError> {
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

            let artifact_path = Library::get_artifact_path(&lib.name)?;
            let path = lib_dir.join(&artifact_path).normalize();

            match &lib.downloads {
                Some(downloads) => {
                    utils::download_file(
                        &downloads.artifact.url,
                        &path,
                        None,
                        Some(&downloads.artifact.sha1),
                    )
                    .await?;
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
                    let downloads = lib.downloads.ok_or(LauncherError::NotFound(
                        "Failed to get downloads".to_owned(),
                    ))?;
                    let classifiers = downloads.classifiers.ok_or(LauncherError::NotFound(
                        "Failed to get classifer".to_string(),
                    ))?;
                    let classifier =
                        classifiers
                            .get(native)
                            .ok_or(LauncherError::NotFound(format!(
                                "Failed to get native for library: {}",
                                lib.name
                            )))?;

                    let file = classifier
                        .url
                        .split('/')
                        .last()
                        .ok_or(LauncherError::Generic(
                            "Failed to get file name".to_string(),
                        ))?;
                    let temp = std::env::temp_dir();
                    let path = temp.join(file).normalize();

                    utils::download_file(&classifier.url, &path, None, Some(&classifier.sha1))
                        .await?;

                    let reader = tokio::io::BufReader::new(File::open(&path).await?);
                    let mut archive = ZipFileReader::with_tokio(reader).await?;

                    for index in 0..archive.file().entries().len() {
                        let entry = archive
                            .file()
                            .entries()
                            .get(index)
                            .ok_or(LauncherError::Generic("Failed to get entry".to_string()))?;

                        let native_file = nat_dir
                            .join(nat_dir.join(sanitize_file_path(entry.filename().as_str()?)))
                            .normalize();
                        info!(
                            "Extracting native file to {}",
                            native_file.to_string_lossy()
                        );

                        if entry.dir()? {
                            if !native_file.exists() {
                                fs::create_dir_all(&native_file).await?;
                            }
                        } else {
                            if native_file.exists() && native_file.is_file() {
                                continue;
                            }

                            if let Some(parent) = native_file.parent() {
                                if !parent.exists() {
                                    fs::create_dir_all(&parent).await?;
                                }
                            }

                            let mut entry_reader = archive.reader_without_entry(index).await?;
                            let writer = OpenOptions::new()
                                .write(true)
                                .create_new(true)
                                .open(&native_file)
                                .await?;

                            futures::io::copy(&mut entry_reader, &mut writer.compat_write())
                                .await?;
                        }
                    }

                    fs::remove_file(&path).await?;
                }
            }

            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(), LauncherError>>>()
    .await;

    if installed.iter().any(|e| e.is_err()) {
        installed.iter().for_each(|e| {
            if let Err(error) = e {
                log::error!("{}", error);
            }
        });
        return Err(LauncherError::Generic("".to_string()));
    }

    Ok(())
}

async fn download_assets(
    _event_channel: &mpsc::Sender<ChannelMessage>,
    runtime_directory: &std::path::Path,
    assets_index: Option<manifest::File>,
) -> Result<(), LauncherError> {
    let assets_index = assets_index.ok_or(LauncherError::NotFound(
        "Asset Index was not found".to_string(),
    ))?;

    let assets_objects_directory = runtime_directory.join("assets/objects");
    let assets_index_path = runtime_directory
        .join(format!(
            "assets/indexes/{}.json",
            assets_index.id.ok_or(LauncherError::NotFound(
                "Failed to get assets version".to_string()
            ))?
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
        .map_err(|_| LauncherError::Generic("Failed to convert".to_string()))?;

    let mut reader = std::io::BufReader::new(file);

    let assets: AssetIndex = serde_json::from_reader(&mut reader)?;

    let indexs = futures::stream::iter(assets.objects.iter().map(|(key, asset)| {
        let root = assets_objects_directory.clone();
        async move {
            info!("Fetching asset: {}", key);

            let hash = format!(
                "{}/{}",
                asset
                    .hash
                    .get(0..2)
                    .ok_or(LauncherError::Generic("Failed to get hash id".to_string()))?,
                asset.hash
            );

            let file_path = root.join(&hash).normalize();

            let url = format!("https://resources.download.minecraft.net/{}", hash);

            utils::download_file(&url, &file_path, None, Some(&asset.hash)).await?;

            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(), LauncherError>>>()
    .await;

    if indexs.iter().any(|e| e.is_err()) {
        indexs.iter().for_each(|e| {
            if let Err(err) = e {
                log::error!("{}", err)
            }
        });
        return Err(LauncherError::Generic(
            "Failed to download assets".to_string(),
        ));
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_install_modded() {
        init();
        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir();
        let runtime_dir = runtime_directory.join("runtime");
        let java = runtime_dir.join("java\\zulu21.34.19-ca-jre21.0.3-win_x64\\bin\\javaw.exe");
        let app = AppState::default();

        {
            let mut store = app.java.write().await;
            store
                .insert(21, "".to_string(), java)
                .expect("Failed to insert");
        }
        let config = InstallConfig {
            app_directory: runtime_directory,
            version: "1.20.6".to_string(),
            loader: Loader::Fabric,
            loader_version: None,
        };

        install_minecraft(&app, config, tx)
            .await
            .expect("Failed to install minecraft");
    }

    #[tokio::test]
    async fn test_install() {
        init();

        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir();

        let app = AppState::default();

        let config = InstallConfig {
            app_directory: runtime_directory,
            version: "1.20.6".to_string(),
            loader: Loader::Vanilla,
            loader_version: None,
        };

        install_minecraft(&app, config, tx)
            .await
            .expect("Failed to install minecraft");
    }

    #[tokio::test]
    async fn test_assets() {
        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir().join("runtime");

        let assets: manifest::File = serde_json::from_str(r#"{
            "id": "16",
            "sha1": "8014a719aff1e5c5651e1a04f57993460d76404a",
            "size": 445177,
            "totalSize": 630829417,
            "url": "https://piston-meta.mojang.com/v1/packages/8014a719aff1e5c5651e1a04f57993460d76404a/16.json"
          }"#).expect("Failed to parse");

        download_assets(&tx, &runtime_directory, Some(assets))
            .await
            .expect("Failed to download");
    }

    #[tokio::test]
    async fn test_download_java() {
        init();
        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir().join("runtime");
        download_java(&tx, &runtime_directory, 21)
            .await
            .expect("Failed to download ");
    }

    #[tokio::test]
    async fn test_download_libraries() {
        init();
        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);
        let runtime_directory = std::env::temp_dir().join("runtime");

        let libs = serde_json::from_str::<Vec<Library>>(r#"
            [
                {
                    "downloads": {
                      "artifact": {
                        "path": "com/google/code/gson/gson/2.10.1/gson-2.10.1.jar",
                        "sha1": "b3add478d4382b78ea20b1671390a858002feb6c",
                        "size": 283367,
                        "url": "https://libraries.minecraft.net/com/google/code/gson/gson/2.10.1/gson-2.10.1.jar"
                      }
                    },
                    "name": "com.google.code.gson:gson:2.10.1",
                    "include_in_classpath": true
                  },
                  {
                    "downloads": {
                      "artifact": {
                        "path": "org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3-natives-windows-arm64.jar",
                        "sha1": "e9aca8c5479b520a2a7f0d542a118140e812c5e8",
                        "size": 133378,
                        "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl/3.3.3/lwjgl-3.3.3-natives-windows-arm64.jar"
                      }
                    },
                    "name": "org.lwjgl:lwjgl:3.3.3:natives-windows-arm64",
                    "rules": [{ "action": "allow", "os": { "name": "windows" } }],
                    "include_in_classpath": true
                  },
                  {
                    "downloads": {
                      "artifact": {
                        "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2.jar",
                        "sha1": "3b8e6ebc5851dd3d17e37e5cadce2eff2a429f0f",
                        "size": 104469,
                        "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2.jar"
                      },
                      "classifiers": {
                        "natives-linux": {
                          "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-linux.jar",
                          "sha1": "172c52e586fecf43f759bc4f70a778c01f6fdcc1",
                          "size": 203476,
                          "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-linux.jar"
                        },
                        "natives-windows": {
                          "path": "org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-windows.jar",
                          "sha1": "811f705cbb29e8ae8d60bdf8fdd38c0c123ad3ef",
                          "size": 465810,
                          "url": "https://libraries.minecraft.net/org/lwjgl/lwjgl-stb/3.2.2/lwjgl-stb-3.2.2-natives-windows.jar"
                        }
                      }
                    },
                    "name": "org.lwjgl:lwjgl-stb:3.2.2",
                    "natives": { "windows": "natives-windows", "linux": "natives-linux" },
                    "rules": [
                      { "action": "allow" },
                      { "action": "disallow", "os": { "name": "osx" } },
                      { "action": "disallow", "os": { "name": "linux-arm64" } },
                      { "action": "disallow", "os": { "name": "linux-arm32" } },
                      { "action": "disallow", "os": { "name": "osx-arm64" } }
                    ],
                    "include_in_classpath": true
                  }
            ]
        
        "#).expect("Failed to parse");

        info!("{:#?}", libs);

        download_libraries(&tx, &runtime_directory, "1.20.6", libs)
            .await
            .expect("Failed to download");
    }

    #[tokio::test]
    async fn test_download_client() {
        init();
        let versions_directory = std::env::temp_dir()
            .join("runtime\\versions\\1.20.6")
            .normalize();

        let downloads = serde_json::from_str::<Downloads>(
            r#"{
            "server_mappings": {
              "sha1": "9e96100f573a46ef44caab3e716d5eb974594bb7",
              "size": 7283803,
              "url": "https://piston-data.mojang.com/v1/objects/9e96100f573a46ef44caab3e716d5eb974594bb7/server.txt"
            },
            "client_mappings": {
              "sha1": "de46c8f33d7826eb83e8ef0e9f80dc1f08cb9498",
              "size": 9422442,
              "url": "https://piston-data.mojang.com/v1/objects/de46c8f33d7826eb83e8ef0e9f80dc1f08cb9498/client.txt"
            },
            "server": {
              "sha1": "145ff0858209bcfc164859ba735d4199aafa1eea",
              "size": 51420480,
              "url": "https://piston-data.mojang.com/v1/objects/145ff0858209bcfc164859ba735d4199aafa1eea/server.jar"
            },
            "client": {
              "sha1": "05b6f1c6b46a29d6ea82b4e0d42190e42402030f",
              "size": 26565641,
              "url": "https://piston-data.mojang.com/v1/objects/05b6f1c6b46a29d6ea82b4e0d42190e42402030f/client.jar"
            }
          }"#,
        ).expect("Failed to parse");

        let (tx, _) = tokio::sync::mpsc::channel::<ChannelMessage>(2);

        download_client(&tx, "1.20.6", &versions_directory, Some(downloads))
            .await
            .expect("Failed to download");
    }
}
