use crate::{
    errors::LauncherError,
    install_minecraft,
    installer::{
        compression::{self, extract_dir},
        utils,
    },
    manifest,
};
use futures::StreamExt;
use serde::Deserialize;
use std::{
    collections::HashMap,
    path::{Path, PathBuf},
};
use tokio::fs::File;

#[derive(Debug, Deserialize)]
enum ContentType {
    Resource,
    Shader,
    Mod,
    ModPack,
}

#[derive(Debug, Deserialize)]
pub struct InstallContent {
    pack_type: ContentType,
    outdir: PathBuf,
    file: manifest::File,
}

pub async fn install_content(config: InstallContent) -> Result<(), LauncherError> {
    let path = match config.pack_type {
        ContentType::Resource => config.outdir.join("resourcepacks"),
        ContentType::Shader => config.outdir.join("shaders"),
        ContentType::Mod => config.outdir.join("mods"),
        ContentType::ModPack => config.outdir,
    };
    utils::download_file(&config.file.url, &path, None, Some(&config.file.sha1)).await?;
    Ok(())
}
