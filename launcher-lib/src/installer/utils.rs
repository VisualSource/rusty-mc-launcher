use log::{info, warn};
use sha1::{Digest, Sha1};
use std::path::Path;
use std::time::Duration;
use tokio::fs::{create_dir_all, File};
use tokio::io::AsyncWriteExt;

use crate::error::{Error, Result};

lazy_static::lazy_static! {
    pub static ref REQUEST_CLIENT: reqwest::Client = {
        let mut headers = reqwest::header::HeaderMap::new();
        let header = reqwest::header::HeaderValue::from_str(
            &format!("VisualSource/rusty-mc-launcher/{}",env!("CARGO_PKG_VERSION"))
        ).expect("Failed to construct http client user agent");

        headers.insert(reqwest::header::USER_AGENT, header);

        reqwest::Client::builder()
        .tcp_keepalive(Some(std::time::Duration::from_secs(10)))
        .default_headers(headers)
        .build()
        .expect("Request client construct failed.")
    };
}
const FETCH_ATTEMPTS: usize = 5;

/// Gets the sha1 hash of a file.
pub async fn get_file_hash(path: &Path) -> Result<String> {
    let mut file = File::open(path)
        .await?
        .try_into_std()
        .map_err(|_| Error::Generic("Failed to open file as std".to_string()))?;
    let mut hasher = Sha1::new();
    let size = std::io::copy(&mut file, &mut hasher)?;
    let file_hash = hasher.finalize();
    info!("Current size of file on disk: {}", size);

    Ok(hex::encode(file_hash))
}

/// Tries to download file from source.
/// If as sha1 hash is given, the output location is checked if the file exists and checks if hash
/// matches file at that location and does not try to download from remote source if hash matches
pub async fn download_file(
    source_url: &str,
    output_directory: &Path,
    auth: Option<&str>,
    sha1: Option<&str>,
) -> Result<()> {
    if let Some(parent) = output_directory.parent() {
        if !parent.exists() {
            create_dir_all(&parent).await?;
        }
    }

    if output_directory.exists() && output_directory.is_file() {
        if let Some(hash) = sha1 {
            info!("File exists and has sha1 hash");
            let mut file = File::open(&output_directory)
                .await?
                .try_into_std()
                .map_err(|_| Error::Generic("".to_string()))?;
            let mut hasher = Sha1::new();

            let size = std::io::copy(&mut file, &mut hasher)?;

            let file_hash = hasher.finalize();

            info!("Current size of file on disk: {}", size);
            if hex::encode(file_hash) == hash {
                return Ok(());
            }
        } else {
            warn!("File was found on disk but now removing it and redownloading from source as it can not be verified.");
            tokio::fs::remove_file(&output_directory).await?;
        }
    }

    if source_url.is_empty() {
        return Err(Error::NotFound("No download url was provided".to_string()));
    }

    for attempt in 1..=(FETCH_ATTEMPTS + 1) {
        if attempt > 1 {
            info!(
                "Fetch Attempt {} | Duration {}ms | Task {}",
                attempt,
                15_000 * attempt,
                source_url
            );
            tokio::time::sleep(Duration::from_millis(15_000 * (attempt as u64))).await;
        }

        let mut req = REQUEST_CLIENT.request(reqwest::Method::GET, source_url);

        if let Some(auth_token) = auth {
            req = req.header(reqwest::header::AUTHORIZATION, auth_token);
        }
        let response = req.send().await;
        match response {
            Ok(mut result) => match File::create(&output_directory).await {
                Ok(mut file) => {
                    let mut hasher = Sha1::new();
                    while let Some(mut chunk) = result.chunk().await? {
                        hasher.update(&chunk);
                        file.write_all_buf(&mut chunk).await?;
                    }

                    file.shutdown().await?;

                    if let Some(hash) = sha1 {
                        let result = hex::encode(hasher.finalize());
                        if result != hash {
                            if attempt <= 3 {
                                continue;
                            }
                            return Err(Error::Sha1Error);
                        }
                    }

                    return Ok(());
                }
                Err(_) if attempt <= 3 => continue,
                Err(err) => return Err(err.into()),
            },
            Err(_) if attempt <= 3 => continue,
            Err(err) => return Err(err.into()),
        }
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
    async fn test_download() {
        init();
        let dir = std::env::temp_dir().join("test.jar");
        info!("{}", dir.to_string_lossy());
        download_file("https://piston-data.mojang.com/v1/objects/05b6f1c6b46a29d6ea82b4e0d42190e42402030f/client.jar", &dir, None, Some("05b6f1c6b46a29d6ea82b4e0d42190e42402030f"))
            .await
            .expect("Failed to download");
    }
}
