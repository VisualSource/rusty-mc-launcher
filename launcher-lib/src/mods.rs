use crate::client::ClientBuilder;
use crate::utils::{self, download_file, ChannelMessage};
use crate::{utils::mods::FileDownload, LauncherLibError};
use futures::StreamExt;
use log::{error, info};
use normalize_path::{self, NormalizePath};
use std::path::PathBuf;
use tokio::{fs, sync::mpsc};

#[derive(serde::Deserialize, serde::Serialize)]
struct ModManifest {
    id: String,
    mods: Vec<FileDownload>,
}

async fn create_or_update_mod_manifest(
    id: String,
    mods_folder: &PathBuf,
    files: &Vec<FileDownload>,
) -> Result<(), LauncherLibError> {
    let dir = mods_folder.join("manifest.json");

    let manifest = if dir.exists() {
        let manifest_str = fs::read_to_string(&dir).await?;
        let mut old_manifest = serde_json::from_str::<ModManifest>(&manifest_str)?;

        old_manifest.mods.extend(files.clone());

        old_manifest
    } else {
        ModManifest {
            id: id.clone(),
            mods: files.clone(),
        }
    };

    let manifest_str = serde_json::to_string(&manifest)?;

    fs::write(dir, manifest_str).await?;

    Ok(())
}

pub async fn install_mod_list(
    id: String,
    files: Vec<FileDownload>,
    game_dir: Option<PathBuf>,
    channel: mpsc::Sender<ChannelMessage>,
) -> Result<(), LauncherLibError> {
    let root_dir =
        game_dir.unwrap_or(ClientBuilder::get_minecraft_dir().expect("Failed to get game dir."));

    let mod_folder = root_dir.join(".mcl").join(id.clone());

    if !mod_folder.exists() {
        fs::create_dir_all(&mod_folder).await?;
    }

    let files_to_download: i32 = files.len() as i32;
    let mut files_total_size = 0;

    for file in &files {
        files_total_size = file.download.size + files_total_size;
    }

    create_or_update_mod_manifest(id.clone(), &mod_folder, &files).await?;

    utils::emit!(
        channel,
        "fetch",
        format!(
            "{{ \"msg\": \"Installing Mods\", \"ammount\": {}, \"size\": {} }}",
            files_total_size, files_to_download
        )
    );

    let installed_mods = futures::stream::iter(files.into_iter().map(|item| {
        let tx = channel.clone();
        let install_dir = mod_folder.clone();
        async move {
            let filename = install_dir
                .join(format!("{}-{}.jar", item.id, item.version))
                .normalize();

            info!(
                "Download Mod: {} {} | Size {}",
                item.name, item.version, item.download.size
            );

            download_file(&item.download.url, &filename, Some(&item.download.hash)).await?;

            utils::emit!(
                tx,
                "download",
                format!(
                    "{{ \"size\": {}, \"file\": \"{}\" }}",
                    item.download.size, item.name
                )
            );

            Ok(())
        }
    }))
    .buffer_unordered(50)
    .collect::<Vec<Result<(), LauncherLibError>>>();

    installed_mods.await.iter().for_each(|x| {
        if let Err(err) = x {
            error!("{}", err);
        }
    });

    utils::emit!(
        channel,
        "end",
        "{ \"key\":\"client\", \"msg\": \"Minecrafts Mods Installed\" }"
    );

    utils::emit!(channel, "complete", "{ \"status\":\"ok\" }");

    Ok(())
}
