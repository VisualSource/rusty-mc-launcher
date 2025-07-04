use crate::error::{Error, Result};
use minecraft_launcher_lib::{
    database::RwDatabase,
    events::DownloadEvent,
    installer::{
        InstallConfig,
        content::{self, InstallContent, UpdateContent, curseforge::install_curseforge_modpack},
        minecraft::install_minecraft,
    },
    models::{
        profile::{Profile, ProfileState},
        queue::{QueueItem, QueueState, QueueType},
    },
};
use std::time::Duration;
use tauri::{AppHandle, Emitter, Manager, Runtime, ipc::Channel};

async fn install_client(
    item: &QueueItem,
    db: &RwDatabase,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metdata) = &item.metadata {
        serde_json::from_str::<InstallConfig>(metdata)?
    } else {
        return Err(Error::Reason("Invalid client metadata".to_string()));
    };

    Profile::set_state(&item.profile_id, ProfileState::Installing, db).await?;

    if let Err(err) = on_event.send(DownloadEvent::RefreshProfile) {
        log::error!("{}", err)
    }
    tokio::time::sleep(Duration::from_secs(1)).await;

    match install_minecraft(config, db, on_event).await {
        Ok(loader) => {
            if let Some(loader_version) = loader {
                Profile::set_loader_version(&item.profile_id, &loader_version, db).await?;
            }
            Profile::set_state(&item.profile_id, ProfileState::Installed, db).await?;

            if let Err(err) = on_event.send(DownloadEvent::InvalidateQuery {
                query_key: vec!["categories".to_string()],
            }) {
                log::error!("{}", err)
            }

            if let Err(err) = on_event.send(DownloadEvent::Toast {
                status: "success".to_string(),
                message: "Client has been installed!".to_string(),
            }) {
                log::error!("{}", err)
            }

            Ok(())
        }
        Err(err) => {
            Profile::set_state(&item.profile_id, ProfileState::Errored, db).await?;

            Err(err.into())
        }
    }
}

async fn install_cf_modpack(
    item: &QueueItem,
    db: &RwDatabase,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)?
    } else {
        return Err(Error::Reason("Invalid metadata config".to_string()));
    };

    install_curseforge_modpack(db, config, on_event).await?;

    Ok(())
}

async fn install_content(
    item: &QueueItem,
    db: &RwDatabase,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)?
    } else {
        return Err(Error::Reason("Invalid metadata config".to_string()));
    };

    content::install_content(config, item.icon.clone(), db, on_event).await?;

    Ok(())
}

async fn install_update(
    item: &QueueItem,
    db: &RwDatabase,
    on_event: &Channel<DownloadEvent>,
) -> Result<()> {
    let config = if let Some(metadata) = &item.metadata {
        log::debug!("{}", metadata);
        serde_json::from_str::<UpdateContent>(metadata)?
    } else {
        return Err(Error::Reason("Invalid update metadata".to_string()));
    };

    Profile::set_state(&item.profile_id, ProfileState::Installing, db).await?;
    if let Err(err) = on_event.send(DownloadEvent::RefreshProfile) {
        log::error!("{}", err)
    }
    tokio::time::sleep(Duration::from_secs(1)).await;

    match content::install_update(&item.profile_id, config, db, on_event).await {
        Ok(updated_version) => {
            Profile::set_state(&item.profile_id, ProfileState::Installed, db).await?;
            Profile::set_pack_data_version(&item.profile_id, &updated_version, db).await?;
            Ok(())
        }

        Err(err) => {
            Profile::set_state(&item.profile_id, ProfileState::Errored, db).await?;
            Err(err.into())
        }
    }
}

pub async fn install<R: Runtime>(app: &AppHandle<R>) {
    let db = app.state::<RwDatabase>();
    let emitter_state = app.state::<tokio::sync::Mutex<Option<Channel<DownloadEvent>>>>();

    let item = QueueItem::get_pending(&db).await;

    match item {
        Ok(Some(item)) => {
            log::debug!("Processing Item: {}", item.id);
            let emitter_c = emitter_state.lock().await;
            if emitter_c.is_none() {
                log::warn!("Download listener not registered: waiting for listener");
                return;
            }

            if let Err(err) = QueueItem::set_state(&item.id, QueueState::Current, &db).await {
                log::error!("{}", err);
                return;
            }

            let emitter = emitter_c.as_ref().unwrap();
            if let Err(err) = emitter.send(DownloadEvent::Init {
                display_name: item.display_name.clone(),
                icon: item.icon.clone(),
                content_type: item.content_type.clone(),
                profile: item.profile_id.clone(),
            }) {
                log::error!("{}", err)
            }
            tokio::time::sleep(Duration::from_secs(2)).await;

            let result = match &item.content_type {
                QueueType::Client => install_client(&item, &db, emitter).await,
                QueueType::Modpack
                | QueueType::Mod
                | QueueType::Shader
                | QueueType::Resourcepack => install_content(&item, &db, emitter).await,
                QueueType::Datapack => Err(Error::Reason("Datapack not supported".to_string())),
                QueueType::CurseforgeModpack => install_cf_modpack(&item, &db, emitter).await,
                QueueType::Update => install_update(&item, &db, emitter).await,
                QueueType::Unknown => Err(Error::Reason("Invalid queue item type".into())),
            };

            let item_state = if let Err(err) = result {
                log::error!("{}", err);

                if let Err(err) = app.emit("rmcl-content-install-failed", err.to_string()) {
                    log::error!("{}", err)
                };

                QueueState::Errored
            } else {
                QueueState::Completed
            };

            if let Err(err) = QueueItem::set_state(&item.id, item_state, &db).await {
                log::error!("{}", err);
            }

            if let Err(err) = emitter.send(DownloadEvent::Finished) {
                log::error!("{}", err);
            }
        }
        Ok(None) => {}
        Err(err) => {
            log::error!("{}", err);
        }
    }
}
