use minecraft_launcher_lib::{
    database::Database,
    events::DownloadEvent,
    installer::content::{self, curseforge::install_curseforge_modpack},
    installer::{content::InstallContent, InstallConfig},
    models::{
        profile::{Profile, ProfileState},
        queue::{QueueItem, QueueState},
    },
};
use tauri::ipc::Channel;
use tokio::sync::RwLock;

use crate::error::{Error, Result};

pub async fn install_client(
    item: &QueueItem,
    db_state: &RwLock<Database>,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metdata) = &item.metadata {
        serde_json::from_str::<InstallConfig>(metdata)?
    } else {
        return Err(Error::Reason("Invalid client metadata".to_string()));
    };

    let db = db_state.write().await;

    Profile::set_state(&item.id, ProfileState::Installing, &db).await?;

    if let Some(loader_version) =
        minecraft_launcher_lib::installer::install_minecraft(config, &db, on_event).await?
    {
        Profile::set_loader_version(&item.profile_id, &loader_version, &db).await?;
    }

    Profile::set_state(&item.profile_id, ProfileState::Installed, &db).await?;
    QueueItem::set_state(&item.id, QueueState::Completed, &db).await?;

    if let Err(err) = on_event.send(DownloadEvent::Finished {}) {
        log::error!("{}", err)
    }

    Ok(())
}

pub async fn install_cf_modpack(
    item: &QueueItem,
    db_state: &RwLock<Database>,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)?
    } else {
        return Err(Error::Reason("Invalid metadata config".to_string()));
    };

    let db = db_state.write().await;
    install_curseforge_modpack(&db, config, on_event).await?;

    QueueItem::set_state(&item.id, QueueState::Completed, &db).await?;

    if let Err(err) = on_event.send(DownloadEvent::Finished {}) {
        log::error!("{}", err)
    }
    Ok(())
}

pub async fn install_content(
    item: &QueueItem,
    db_state: &RwLock<Database>,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)?
    } else {
        return Err(Error::Reason("Invalid metadata config".to_string()));
    };

    let db = db_state.write().await;
    content::install_content(config, item.icon.clone(), &db, on_event).await?;

    QueueItem::set_state(&item.id, QueueState::Completed, &db).await?;

    if let Err(err) = on_event.send(DownloadEvent::Finished {}) {
        log::error!("{}", err)
    }

    Ok(())
}
