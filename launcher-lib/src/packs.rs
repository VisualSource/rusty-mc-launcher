use crate::utils::{self, download_file, ChannelMessage};
use crate::{client::ClientBuilder, errors::LauncherLibError, FileDownload};
use log::error;
use normalize_path::{self, NormalizePath};
use std::path::PathBuf;
use tokio::{fs, sync::mpsc};

#[derive(serde::Deserialize, serde::Serialize, Debug)]
pub enum PackType {
    Resource,
    Shader,
}

pub async fn install_pack(
    file: FileDownload,
    pack_type: PackType,
    game_dir: Option<PathBuf>,
    channel: mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherLibError> {
    let root_dir = if let Some(root) = game_dir {
        root
    } else {
        ClientBuilder::get_minecraft_dir()?
    };

    let outdir = match pack_type {
        PackType::Resource => root_dir.join("resourcepacks").normalize(),
        PackType::Shader => root_dir.join("shaders").normalize(),
    };

    if !outdir.exists() {
        fs::create_dir_all(&outdir).await?;
    }

    let filename = outdir.join(&file.name);

    utils::emit!(
        channel,
        "fetch",
        format!(
            "{{ \"msg\": \"Installing Pack\", \"ammount\": {}, \"size\": {} }}",
            1, file.download.size
        )
    );

    download_file(&file.download.url, &filename, Some(&file.download.hash)).await?;

    utils::emit!(
        channel,
        "download",
        format!(
            "{{ \"size\": {}, \"file\": \"{}\" }}",
            file.download.size, file.name
        )
    );

    utils::emit!(
        channel,
        "end",
        "{ \"key\":\"client\", \"msg\": \"Minecraft pack installed.\" }"
    );

    utils::emit!(channel, "complete", "{ \"status\":\"ok\" }");

    Ok(())
}
