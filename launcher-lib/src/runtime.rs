use async_compression::tokio::write::LzmaDecoder;
use futures::StreamExt;
use log::{debug, error, warn};
use sha1::{Digest, Sha1};
use tokio::{fs, io::AsyncWriteExt, sync::mpsc::Sender};

use crate::errors::LauncherLibError;
use crate::manifest::jvm;
use crate::utils::{self, ChannelMessage};

const JVM_LIST: &str = "https://launchermeta.mojang.com/v1/products/java-runtime/2ec0cc96c44e5a76b9c8b7c39df7210883d12871/all.json";

pub struct Jvm {
    channel: Sender<ChannelMessage>,
}

impl Jvm {
    pub fn new(sender: Sender<ChannelMessage>) -> Self {
        Self { channel: sender }
    }

    pub async fn install_jvm(
        &self,
        version: String,
        game_dir: &std::path::Path,
    ) -> Result<(), LauncherLibError> {
        //ChannelMessage::new("end", "{{ \"key\":\"jvm\" }}")
        utils::emit!(
            self.channel,
            "start",
            format!(
                "{{ \"key\":\"jvm\", \"msg\": \"Installing JVM ({})\" }}",
                version
            )
        );

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

        utils::emit!(
            self.channel,
            "fetch",
            format!(
                "{{ \"msg\": \"JVM Runtime Manifest\", \"ammount\": 1, \"size\": {} }}",
                runtime.manifest.size
            )
        );

        let jvm = reqwest::get(&runtime.manifest.url)
            .await?
            .json::<jvm::JVMFiles>()
            .await?;
        let content_path = base_path.join(&version);

        let mut files_len: i32 = 0;
        let mut download_size: i32 = 0;

        // get combined download size and files exclude dirs
        for file in jvm.files.values() {
            if let Some(download) = &file.downloads {
                if let Some(lzma) = &download.lzma {
                    download_size += lzma.size
                } else {
                    download_size += download.raw.size;
                }

                files_len += 1;
            }
        }

        utils::emit!(
            self.channel,
            "fetch",
            format!(
                "{{ \"msg\": \"JVM Runtime files\", \"ammount\": {}, \"size\": {} }}",
                files_len, download_size
            )
        );

        /* */
        let files = futures::stream::iter(jvm.files.into_iter().map(|(key, file)| {
            let base = content_path.clone();
            let tx = self.channel.clone();
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

                            utils::emit!(
                                tx,
                                "download",
                                format!("{{ \"size\": {}, \"file\": \"{}\" }}", lzma.size, key)
                            );

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

                            utils::emit!(
                                tx,
                                "download",
                                format!(
                                    "{{ \"size\": {}, \"file\": \"{}\" }}",
                                    downloads.raw.size, key
                                )
                            );

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
                        warn!("Did not create syslink: {target}");
                        // fs::symlink_file(current_path, target).await?;
                    }
                    _ => {}
                }

                Ok(String::default())
            }
        }))
        .buffered(50)
        .collect::<Vec<Result<String, LauncherLibError>>>();

        utils::emit!(
            self.channel,
            "start",
            "{ \"key\":\"jvm\", \"msg\": \"Vaildating\" }"
        );

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

        utils::emit!(
            self.channel,
            "end",
            "{ \"key\":\"jvm\", \"msg\": \"JVM installed.\" }"
        );

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    /*use super::*;

    fn init() {
        let _ = env_logger::builder()
            .filter_module("minecraft_launcher_lib", log::LevelFilter::Debug)
            .is_test(true)
            .try_init();
    }*/

    /*#[tokio::test]
    async fn test_jvm_install() {
        init();

        let dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft");


        let mut jvm = Jvm::new();

        jvm.attach(&observer_a);

        if let Err(err) = jvm
            .install_jvm("java-runtime-gamma".to_string(), &dir)
            .await
        {
            eprintln!("{}", err);
        }
    }*/
}
