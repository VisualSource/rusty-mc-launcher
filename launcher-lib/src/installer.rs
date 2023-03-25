use std::env::consts;
use std::path::PathBuf;

use futures::StreamExt;
use log::{debug, error, info};
use normalize_path::NormalizePath;
use tokio::{fs, io};

use crate::errors::LauncherLibError;
use crate::manifest::asset_index::AssetIndex;
use crate::manifest::{Library, Manifest, RuleCondition, File};
use crate::metadata::get_launcher_manifest;
use crate::observer::{Observer, Subject};
use crate::runtime::Jvm;
use crate::utils::download_file;
use crate::utils::fabric;

//https://www.reddit.com/r/rust/comments/gi2pld/callback_functions_the_right_way/
//https://github.com/lpxxn/rust-design-pattern/blob/master/behavioral/observer.rs
//https://github.com/tomsik68/mclauncher-api/wiki/Libraries
//https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master

enum Loader {
    Fabric,
    Forge,
    Vanilla,
}

pub struct Installer<'a, T: Observer> {
    observers: Vec<&'a T>,
    loader_version: String,
    version: String,
    loader: Loader,
    mc: String,
    game_dir: PathBuf,
}

impl<'a, T: Observer + PartialEq> Subject<'a, T> for Installer<'a, T> {
    fn attach(&mut self, observer: &'a T) {
        self.observers.push(observer);
    }
    fn detach(&mut self, observer: &'a T) {
        if let Some(idx) = self.observers.iter().position(|x| *x == observer) {
            self.observers.remove(idx);
        }
    }
    fn notify_observers(&self, event: String, msg: String) {
        for item in self.observers.iter() {
            item.update(event.clone(), msg.clone());
        }
    }
    fn inhert(&mut self, observers: &Vec<&'a T>) {
        self.observers.extend(observers);
    }
}

impl<'a, T: Observer + PartialEq> Installer<'a, T> {
    pub fn new(version: String, game_dir: PathBuf) -> Installer<'a, T> {
        let forge = regex::Regex::new(r"(?P<mc>\d+.\d+.\d+)-forge-(?P<loader>\d+.\d+.\d+)")
            .expect("Failed to make regex");
        let fabric =
            regex::Regex::new(r"fabric-loader-(?P<loader>\d+.\d+.\d+)-(?P<mc>\d+.\d+.\d+)")
                .expect("Failed to create regex");
        let (mc, loader, loader_version) = if let Some(caps) = fabric.captures(&version) {
            (
                caps["mc"].to_string(),
                Loader::Fabric,
                caps["loader"].to_string(),
            )
        } else if let Some(caps) = forge.captures(&version) {
            (
                caps["mc"].to_string(),
                Loader::Forge,
                caps["loader"].to_string(),
            )
        } else {
            (version.clone(), Loader::Vanilla, "".to_string())
        };

        Self {
            observers: Vec::new(),
            mc,
            loader,
            version,
            loader_version,
            game_dir,
        }
    }

    pub async fn install(self) -> Result<(), LauncherLibError> {
        let launcher_manifest = get_launcher_manifest(Some(self.mc.clone())).await?;
        // .minecraft/versions/VERSION/VERSION.json
        let version_root = self
            .game_dir
            .join(format!("versions/{id}", id = launcher_manifest.id));
        let version_json = version_root.join(format!("{}.json", self.mc.clone()));
        let client_jar = version_root.join(format!("{}.jar", self.mc.clone()));

        // download json
        if !version_json.is_file() {
            info!("Downloading version json");
            download_file(
                &launcher_manifest.url,
                &version_json,
                Some(&launcher_manifest.sha1),
            )
            .await?;
        }

        info!("Reading manifest");
        let manifest = Manifest::read_manifest(&version_json, false).await?;

        //client JAR
        if !client_jar.is_file() {
            info!("Download client jar");
            if let Some(downloads) = &manifest.downloads {
                debug!("{:#?}", downloads.client);
                download_file(
                    &downloads.client.url,
                    &client_jar,
                    Some(&downloads.client.sha1),
                )
                .await?;
            }
        }

        // libraries
        //https://patshaughnessy.net/2020/1/20/downloading-100000-files-using-async-rust
        let installed_libs = futures::stream::iter(manifest.libraries.into_iter().map(|lib| {
            let game_dir = self.game_dir.clone();
            let id = manifest.id.clone();
            async move {
                if let Some(rule) = &lib.rules {
                    let allowed = rule
                        .iter()
                        .map(|condition| match condition {
                            RuleCondition::Os { action, os } => {
                                let active = os
                                    .iter()
                                    .map(|(key, map_value)| match key.as_str() {
                                        "name" => map_value.replace("osx", "macos") == consts::OS,
                                        "arch" => map_value == consts::ARCH,
                                        "version" => {
                                            if let Ok(re) = regex::Regex::new(&map_value) {
                                                let os_version =
                                                    os_info::get().version().to_string();
                                                return re.is_match(&os_version);
                                            }

                                            false
                                        }
                                        _ => false,
                                    })
                                    .all(|x| x);

                                (action == "allow" && active) || (action == "disallow" && !active)
                            }
                            _ => false,
                        })
                        .all(|x| x);

                    if !allowed {
                        return Ok(());
                    }
                }

                if let Some(downloads) = &lib.downloads {
                    let path = downloads.artifact.path.as_ref().ok_or_else(|| {
                        LauncherLibError::Generic("Failed to get download path".to_string())
                    })?;

                    let output_file = game_dir.join(format!("libraries/{}", path));

                    info!("Downloading Library: {:?}", output_file);
                    download_file(
                        &downloads.artifact.url,
                        &output_file,
                        Some(&downloads.artifact.sha1),
                    )
                    .await?;

                    if let Some(classifiers) = &downloads.classifiers {
                        let natives_list = lib.natives.as_ref().ok_or_else(|| {
                            LauncherLibError::Generic("Failed to get natives strings".to_string())
                        })?;
                        let os = if natives_list.contains_key("osx") && consts::OS == "macos" {
                            "osx"
                        } else {
                            consts::OS
                        };

                        if let Some(native_id) = natives_list.get(os) {
                            if let Some(file) = classifiers.get(native_id) {
                                let path = file.path.as_ref().ok_or_else(|| {
                                    LauncherLibError::Generic(
                                        "Failed to get download path".to_string(),
                                    )
                                })?;
                                let output_file = game_dir.join(format!("libraries/{}", path));

                                download_file(&file.url, &output_file, Some(&file.sha1)).await?;

                                if let Some(extract) = &lib.extract {
                                    let archive = fs::File::open(output_file).await?;
                                    let mut reader =
                                        async_zip::read::seek::ZipFileReader::new(archive).await?;

                                    let outdir = game_dir.join(format!("versions/{}/natives", id));

                                    if !outdir.exists() {
                                        fs::create_dir_all(&outdir).await?;
                                    }
                                    //https://github.com/Majored/rs-async-zip/blob/main/examples/file_extraction.rs
                                    for index in 0..reader.file().entries().len() {
                                        let entry =
                                            &reader.file().entries().get(index).unwrap().entry();
                                        let path = entry
                                            .filename()
                                            .replace("\\", "/")
                                            .split("/")
                                            .map(sanitize_filename::sanitize)
                                            .collect::<PathBuf>();

                                        if extract.exclude.contains(
                                            &path
                                                .to_str()
                                                .expect("Failed to convent path buf")
                                                .to_string(),
                                        ) {
                                            continue;
                                        }

                                        let entry_is_dir = entry.filename().ends_with('/');
                                        let full_output = game_dir.join(path);
                                        let mut entry_reader = reader.entry(index).await?;

                                        if entry_is_dir {
                                            if !full_output.exists() {
                                                fs::create_dir_all(&full_output).await?;
                                            }
                                        } else {
                                            let parent = full_output.parent().expect(
                                                "A file entry should have parent directories",
                                            );
                                            if !parent.is_dir() {
                                                fs::create_dir_all(parent).await?;
                                            }

                                            let mut writer = fs::File::create(&full_output).await?;
                                            io::copy(&mut entry_reader, &mut writer).await?;
                                        }
                                    }
                                }
                            }
                        }
                    }

                    return Ok(());
                }

                if let Some(url) = &lib.url {
                    let (org, name, version) =
                        match lib.name.splitn(2, ":").collect::<Vec<&str>>().get(0..=2) {
                            Some(value) => (value[0], value[1], value[2]),
                            None => {
                                return Err(LauncherLibError::Generic(
                                    "Failed to parse lib name string".to_string(),
                                ))
                            }
                        };

                    //net.fabricmc:tiny-mappings-parser:0.3.0+build.17
                    // Path => net/fabricmc/tiny-mappings-parser/0.3.0+build.17/tiny-mappings-parser-0.3.0+build.17.jar
                    let path = format!(
                        "{0}/{1}/{2}/{1}-{2}.jar",
                        org.replace(".", "/"),
                        name,
                        version
                    );
                    let seperator = if url.ends_with("/") { "" } else { "/" };
                    let url = format!("{}{}{}", url, seperator, path);
                    let output_dir = game_dir.join(path).normalize();

                    download_file(&url, &output_dir, None).await?;
                }

                Err(LauncherLibError::NotFound(
                    "Was unable to download library file".to_string(),
                ))
            }
        }))
        .buffer_unordered(50)
        .collect::<Vec<Result<(), LauncherLibError>>>();

        installed_libs.await.iter().for_each(|x| {
            if let Err(err) = x {
                error!("{}", err);
            }
        });

        // download Asset Indexs
        if let Some(assets) = &manifest.asset_index {
            let root = self.game_dir.join("assets/objects");

            let index_file = self.game_dir.join(format!(
                "assets/indexes/{}.json",
                manifest.assets.expect("Should have assets")
            ));
            download_file(&assets.url, &index_file, Some(&assets.sha1)).await?;

            let index_raw = fs::read_to_string(&index_file).await?;
            let asset_index = serde_json::from_str::<AssetIndex>(&index_raw)?;

            let indexs =
                futures::stream::iter(asset_index.objects.into_iter().map(|(key, asset)| {
                    let item = root.clone();

                    async move {
                        let hash_id = format!(
                            "{}/{}",
                            asset.hash.get(0..2).expect("Should be able to get"),
                            asset.hash
                        );
                        let out = item.join(&hash_id);
                        debug!("Index {}", key);
                        download_file(
                            &format!("https://resources.download.minecraft.net/{}", hash_id),
                            &out,
                            Some(&asset.hash),
                        )
                        .await?;

                        Ok(())
                    }
                }))
                .buffer_unordered(50)
                .collect::<Vec<Result<(), LauncherLibError>>>();

            indexs.await.iter().for_each(|x| {
                if let Err(err) = x {
                    error!("{}", err);
                }
            });
        }

        // logging
        info!("Fetching Logging Config");
        if let Some(logging) = manifest.logging {
            let logging_id = logging.client.file.id.ok_or_else(|| {
                LauncherLibError::Generic("Failed to get logging config name.".to_string())
            })?;
            let logging_config = self
                .game_dir
                .join(format!("assets/log_configs/{}", logging_id));
            download_file(
                &logging.client.file.url,
                &logging_config,
                Some(&logging.client.file.sha1),
            )
            .await?;
        }

        // java
        if let Some(java) = &manifest.java_version {
            let mut jvm = Jvm::<T>::new();
            jvm.inhert(&self.observers);
            jvm.install_jvm(java.component.clone(), &self.game_dir)
                .await?;
        }

        // debug!("{:#?}",manifest.arguments);

        // install after java so we know that a java runtime exists
        match self.loader {
            Loader::Fabric => {
                info!("Install Fabric");
                let runtime = manifest
                    .java_version
                    .ok_or(LauncherLibError::Generic(
                        "Failed to get java runtime".to_string(),
                    ))?
                    .component;
                fabric::run_fabric_installer(&self.mc, &self.loader_version, &self.game_dir, runtime)
                    .await?;

                let version_root = self
                    .game_dir
                    .join(format!("versions/{id}", id = self.version.clone()));
                let mod_jar = version_root.join(format!("{}.jar", self.version.clone()));

                info!("Download client jar");
                if let Some(downloads) = manifest.downloads {
                    debug!("{:#?}", downloads.client);
                    download_file(&downloads.client.url,&mod_jar,Some(&downloads.client.sha1)).await?;
                }
                
            }
            Loader::Forge => {
                info!("Install Forge");
            }
            _ => {}
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_module("minecraft_launcher_lib", log::LevelFilter::Debug)
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_sha1() {
        init();

        let dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft\\test.json");
        let url = "https://piston-meta.mojang.com/v1/packages/368cca4902de6067b3eb5131bdb575612f6b96e3/2.json".to_string();
        let sha1 = "368cca4902de6067b3eb5131bdb575612f6b96e3".to_string();

        if let Err(err) = download_file(&url, &dir, Some(&sha1)).await {
            eprintln!("{}", err);
        }
    }

    #[derive(PartialEq)]
    struct ConcreteObserver {
        id: i32,
    }
    impl Observer for ConcreteObserver {
        fn update(&self, event: String, msg: String) {
            println!("Observer id:{} received event!", self.id);
        }
    }

    #[tokio::test]
    async fn test_installer() {
        init();

        let observer_a = ConcreteObserver { id: 1 };

        let mut installer = Installer::new(
            "fabric-loader-0.14.18-1.19.4".to_string(),
            PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft"),
        );

        installer.attach(&observer_a);

        if let Err(err) = installer.install().await {
            eprintln!("{:#?}", err);
        }
    }
}
