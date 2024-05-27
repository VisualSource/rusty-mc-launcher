mod mrpack;
use crate::{errors::LauncherError, manifest, AppState, ChannelMessage};

pub use mrpack::install_mrpack;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub enum ContentType {
    Resource,
    Shader,
    Mod,
    ModPack,
}

#[derive(Debug, Deserialize)]
pub struct InstallContent {
    content_type: ContentType,
    profile: Option<String>,
    files: Vec<manifest::File>,
}

pub async fn install_content(
    app: &AppState,
    config: InstallContent,
    _event_channel: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherError> {
    unimplemented!()
    /*  let outdir = app
        .get_path("path.app")
        .await?
        .join("profiles")
        .join(config.profile);

    let path = match config.pack_type {
        ContentType::Resource => outdir.join("resourcepacks"),
        ContentType::Shader => outdir.join("shaders"),
        ContentType::Mod => outdir.join("mods"),
        ContentType::ModPack => outdir,
    };
    utils::download_file(&config.file.url, &path, None, Some(&config.file.sha1)).await?;
    Ok(())*/
}
