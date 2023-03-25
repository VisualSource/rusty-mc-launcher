use crate::errors::LauncherLibError;
use crate::manifest::jvm;
use crate::observer::{Observer, Subject};
use crate::utils;
use async_compression::tokio::write::LzmaDecoder;
use futures::StreamExt;
use log::{debug, error};
use sha1::{Digest, Sha1};
use std::path::PathBuf;
use tokio::{fs, io::AsyncWriteExt};

const JVM_LIST: &str = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

pub struct Jvm<'a, T: Observer> {
    observers: Vec<&'a T>,
}

impl<'a, T: Observer + PartialEq> Subject<'a, T> for Jvm<'a, T> {
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

impl<'a, T: Observer + PartialEq> Jvm<'a, T> {
    pub fn new() -> Jvm<'a, T> {
        Self {
            observers: Vec::new(),
        }
    }

    pub async fn install_jvm(
        &self,
        version: String,
        game_dir: &PathBuf,
    ) -> Result<(), LauncherLibError> {
        let manifest = reqwest::get(JVM_LIST)
            .await?
            .json::<jvm::JvmManifest>()
            .await?;
        let platform = utils::jvm::get_platform();

        let base_path = game_dir.join(format!("runtime/{}/{}", version, platform));

        let jvms = manifest.get(&platform).ok_or_else(|| {
            LauncherLibError::Generic("Failed to get jvm runtime native.".to_string())
        })?;
        let runtimes = jvms.get(&version).ok_or_else(|| {
            LauncherLibError::NotFound(format!("Jvm runtime ({}), could not be found", version))
        })?;
        let runtime = runtimes
            .first()
            .ok_or_else(|| LauncherLibError::Generic("Failed to get jvm manifest".to_string()))?;

        let jvm = reqwest::get(&runtime.manifest.url)
            .await?
            .json::<jvm::JVMFiles>()
            .await?;
        let content_path = base_path.join(&version);

        /* */
        let files = futures::stream::iter(jvm.files.into_iter().map(|(key, file)| {
            let base = content_path.clone();
            async move {
                let current_path = base.join(&key);

                match file.file_type.as_str() {
                    "file" => {
                        let downloads = file.downloads.as_ref().ok_or_else(|| {
                            LauncherLibError::Generic("Expected downloads".to_string())
                        })?;

                        if let Some(lzma) = &downloads.lzma {
                            debug!("JVM FILE LZMA: {}", key);

                            if let Some(p) = current_path.parent() {
                                if !p.exists() {
                                    fs::create_dir_all(p).await?;
                                }
                            }

                            let output_file = fs::File::create(&current_path).await?;
                            let mut decoder = LzmaDecoder::new(output_file);
                            let mut response = reqwest::get(&lzma.url).await?;
                            let mut hasher = Sha1::new();

                            while let Some(mut chuck) = response.chunk().await? {
                                hasher.update(&chuck);
                                decoder.write_all_buf(&mut chuck).await?;
                            }

                            decoder.shutdown().await?;

                            // compress sha1 check
                            if hex::encode(hasher.finalize()) != lzma.sha1 {
                                return Err(LauncherLibError::Sha1Error);
                            }

                            let mut decom_sha1 = Sha1::new();

                            let src = fs::read(&current_path).await?;
                            decom_sha1.update(src);

                            let result = hex::encode(decom_sha1.finalize());

                            // decompressed sha1 check
                            if result != downloads.raw.sha1 {
                                return Err(LauncherLibError::Sha1Error);
                            }

                            let created = current_path
                                .metadata()?
                                .created()?
                                .duration_since(std::time::UNIX_EPOCH)?
                                .as_nanos();

                            return Ok(format!("{} /#// {} {}\n", key, result, created));
                        } else {
                            debug!("JVM FILE RAW: {}", key);
                            let hash = utils::download_file(
                                &downloads.raw.url,
                                &current_path,
                                Some(&downloads.raw.sha1),
                            )
                            .await?;
                            let created = current_path
                                .metadata()?
                                .created()?
                                .duration_since(std::time::UNIX_EPOCH)?
                                .as_nanos();

                            return Ok(format!("{} /#// {} {}\n", key, hash, created));
                        }

                        /*if file.executable {
                            // make executable
                            fs::set_permissions(current_path, )
                        }*/
                    }
                    "directory" => {
                        debug!("JVM DIR: {current_path:?}");
                        fs::create_dir_all(&current_path).await?;
                    }
                    "link" => {
                        let target = file.target.as_ref().ok_or_else(|| {
                            LauncherLibError::Generic("Expected Target".to_string())
                        })?;
                        debug!("JVM SYMLINK: {target}");
                        // fs::symlink_file(current_path, target).await?;
                    }
                    _ => {}
                }

                Ok(String::default())
            }
        }))
        .buffered(50)
        .collect::<Vec<Result<String, LauncherLibError>>>();

        let sha1_contents = files
            .await
            .iter()
            .filter_map(|x| match x {
                Ok(value) => {
                    if value.is_empty() {
                        return None;
                    }
                    Some(value.to_owned())
                }
                Err(err) => {
                    error!("{}", err);
                    None
                }
            })
            .collect::<Vec<String>>()
            .join("");

        let sha1_file = content_path.join(format!("{0}.sha1", version));
        fs::write(sha1_file, sha1_contents).await?;

        let version_file = base_path.join(".version");

        if let Some(p) = version_file.parent() {
            if !p.exists() {
                fs::create_dir_all(&version_file).await?;
            }
        }

        fs::write(version_file, &runtime.version.name).await?;

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

    #[derive(PartialEq)]
    struct ConcreteObserver {
        id: i32,
    }
    impl Observer for ConcreteObserver {
        fn update(&self, event: String, msg: String) {
            println!("Observer id:{} received event! | {event} | {msg} ", self.id);
        }
    }

    #[tokio::test]
    async fn test_jvm_install() {
        init();

        let dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft");
        let observer_a = ConcreteObserver { id: 1 };

        let mut jvm = Jvm::new();

        jvm.attach(&observer_a);

        if let Err(err) = jvm
            .install_jvm("java-runtime-gamma".to_string(), &dir)
            .await
        {
            eprintln!("{}", err);
        }
    }
}
