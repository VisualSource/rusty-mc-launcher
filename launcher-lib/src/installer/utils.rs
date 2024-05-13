use log::{info, warn};
use serde::{Deserialize, Serialize};
use sha1::{Digest, Sha1};
use std::path::Path;
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::{
    fs::{create_dir_all, File},
    io::BufReader,
};

use crate::errors::LauncherError;

lazy_static::lazy_static! {
    pub static ref REQUEST_CLIENT: reqwest::Client = {
        let mut headers = reqwest::header::HeaderMap::new();
        let header = reqwest::header::HeaderValue::from_str(&format!("
        VisualSource/rusty-mc-launcher/{}",env!("CARGO_PKG_VERSION"))).expect("Failed to construct http client user agent");
        headers.insert(reqwest::header::USER_AGENT, header);
        reqwest::Client::builder().tcp_keepalive(Some(std::time::Duration::from_secs(10))).default_headers(headers).build().expect("Request client construct failed.")
    };
}
const FETCH_ATTEMPTS: usize = 3;

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct ChannelMessage {
    pub event: String,
    pub value: String,
}

impl ChannelMessage {
    pub fn new(event: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            event: event.into(),
            value: value.into(),
        }
    }
}
//$event_channel:expr, $event_name:literal,
#[macro_export]
macro_rules! event {
    ($event_channel:expr,$event_name:literal, $($json:tt)+) => {
        $crate::installer::utils::event_internal::send_event(
            $event_channel,
            $event_name,
            serde_json::json_internal!($($json)+),
        )
        .await;
    };
}

pub mod event_internal {
    use super::ChannelMessage;
    use log::error;

    pub async fn send_event<T>(
        channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
        event: T,
        message: serde_json::Value,
    ) where
        T: Into<String>,
    {
        if let Err(error) = channel
            .send(ChannelMessage::new(event.into(), message.to_string()))
            .await
        {
            error!("{}", error);
        }
    }
}

pub async fn download_file(
    source_url: &str,
    output_directory: &Path,
    auth: Option<&str>,
    sha1: Option<&str>,
) -> Result<(), LauncherError> {
    if !output_directory.exists() {
        create_dir_all(&output_directory).await?;
    }

    if output_directory.exists() && output_directory.is_file() {
        if let Some(hash) = sha1 {
            let file = File::open(&output_directory).await?;
            let mut buf_reader = BufReader::new(file);
            let mut buffer = Vec::new();

            let size = buf_reader.read_to_end(&mut buffer).await?;
            info!("Current size of file on disk: {}", size);
            if hex::encode(Sha1::digest(buffer)) == hash {
                return Ok(());
            }
        } else {
            warn!(
                "No sha hash was provided but file exists! File: {}",
                output_directory.to_string_lossy()
            );
        }
    }

    for attempt in 1..=(FETCH_ATTEMPTS + 1) {
        let mut req = REQUEST_CLIENT.request(reqwest::Method::GET, source_url);

        if let Some(auth_token) = auth {
            req = req.header(reqwest::header::AUTHORIZATION, auth_token);
        }
        let response = req.send().await;
        match response {
            Ok(mut result) => match File::open(&output_directory).await {
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
                            return Err(LauncherError::Sha1Error);
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
