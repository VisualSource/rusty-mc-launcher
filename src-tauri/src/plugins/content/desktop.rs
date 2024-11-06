use minecraft_launcher_lib::{
    database::Database,
    events::DownloadEvent,
    installer::InstallConfig,
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
    {
        let db = db_state.write().await;
        Profile::set_state(&item.id, ProfileState::Installing, &db).await?;
    }

    let config = if let Some(metdata) = &item.metadata {
        serde_json::from_str::<InstallConfig>(metdata)?
    } else {
        return Err(Error::Reason("Missing client install metadata".to_string()));
    };

    let db = db_state.write().await;
    if let Some(loader_version) =
        minecraft_launcher_lib::installer::install_minecraft(config, &db, on_event).await?
    {
        Profile::set_loader_version(&item.profile_id, &loader_version, &db).await?;
    }

    Profile::set_state(&item.profile_id, ProfileState::Installed, &db).await?;
    QueueItem::set_state(&item.id, QueueState::Completed, &db).await?;

    Ok(())
}
