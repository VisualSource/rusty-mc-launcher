use minecraft_launcher_lib::{
    content::InstallContent, models::QueueItem, AppState, ChannelMessage, InstallConfig,
};

use crate::errors::Error;

pub async fn handle_content_install(
    item: &QueueItem,
    app: &AppState,
    tx: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), Error> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)
            .map_err(|e| Error::Generic(e.to_string()))?
    } else {
        return Err(Error::Generic("No metadata for config".to_string()));
    };

    minecraft_launcher_lib::content::install_content(app, config, item.icon.clone(), tx).await?;

    app.set_queue_item_state(&item.id, "COMPLETED").await?;
    Ok(())
}

pub async fn handle_external_pack_install(
    item: &QueueItem,
    app: &AppState,
    tx: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), Error> {
    app.set_profile_state(&item.profile_id, "INSTALLING")
        .await?;
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallContent>(metadata)
            .map_err(|e| Error::Generic(e.to_string()))?
    } else {
        return Err(Error::Generic(
            "No metadata was provide for client install.".to_string(),
        ));
    };

    minecraft_launcher_lib::content::external::install_curseforge_modpack(app, config, tx).await?;

    app.set_profile_state(&item.profile_id, "INSTALLED").await?;
    app.set_queue_item_state(&item.id, "COMPLETED").await?;

    Ok(())
}

pub async fn handle_client_install(
    item: &QueueItem,
    app: &AppState,
    tx: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), Error> {
    app.set_profile_state(&item.profile_id, "INSTALLING")
        .await?;

    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<InstallConfig>(metadata)
            .map_err(|e| Error::Generic(e.to_string()))?
    } else {
        return Err(Error::Generic(
            "No metadata was provide for client install.".to_string(),
        ));
    };

    if let Some(loader_version) = minecraft_launcher_lib::install_minecraft(app, config, tx).await?
    {
        app.set_profile_loader_version(&item.profile_id, &loader_version)
            .await?;
    }

    app.set_profile_state(&item.profile_id, "INSTALLED").await?;
    app.set_queue_item_state(&item.id, "COMPLETED").await?;

    Ok(())
}
