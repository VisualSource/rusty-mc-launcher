use log::LevelFilter;
use minecraft_launcher_lib::{
    content,
    errors::LauncherError,
    models::{QueueItem, QueueType},
    AppState, ChannelMessage, Database, InstallConfig,
};
use std::time::Duration;
use tauri::{plugin::TauriPlugin, App, AppHandle, Manager, Wry};
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

use crate::errors::Error;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
}

pub fn single_instance(app: &AppHandle, argv: Vec<String>, cwd: String) {
    if let Err(err) = app.emit_all("rmcl://start", Payload { args: argv, cwd }) {
        log::error!("{}", err);
    }
}

fn create_db_path(path: &std::path::Path) -> String {
    let database_file = path.join("database.db");
    let db_str = database_file.to_string_lossy().to_string();
    let no_dive = db_str
        .split_once(':')
        .expect("Failed to parse connection string for database!")
        .1;

    format!("sqlite:{}", no_dive)
}

const DEFAULT_TIMEZONE_STRATEGY: TimezoneStrategy = TimezoneStrategy::UseUtc;
pub fn init_logger() -> TauriPlugin<Wry> {
    let level = if let Some(value) = option_env!("MCL_LOG") {
        value.parse::<LevelFilter>().unwrap_or(LevelFilter::Error)
    } else {
        LevelFilter::Info
    };

    let time_format = time::format_description::parse(
        "[weekday repr:short], [day] [month repr:short] [year] [hour]:[minute]:[second]",
    )
    .expect("Failed to get time formatter.");
    let logger = tauri_plugin_log::Builder::new()
        .level(level)
        .format(move |out, message, record| {
            let msg = message.to_string();

            if msg.starts_with("rmcl:") {
                out.finish(format_args!("{}", message));
            } else {
                let timestamp = DEFAULT_TIMEZONE_STRATEGY.get_now();

                let timed = timestamp
                    .format(&time_format)
                    .unwrap_or_else(|_| timestamp.to_string());

                out.finish(format_args!(
                    "rmcl:core:{} [{}] : {}",
                    record.level().to_string().to_lowercase(),
                    timed,
                    message
                ))
            }
        })
        .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
        .build();

    logger
}

async fn handle_content_install(
    item: &QueueItem,
    app: &AppState,
    tx: &tokio::sync::mpsc::Sender<ChannelMessage>,
) -> Result<(), Error> {
    let config = if let Some(metadata) = &item.metadata {
        serde_json::from_str::<content::InstallContent>(metadata)
            .map_err(|e| Error::Generic(e.to_string()))?
    } else {
        return Err(Error::Generic("No metadata for config".to_string()));
    };

    minecraft_launcher_lib::content::install_content(app, config, tx).await?;

    Ok(())
}

async fn handle_client_install(
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

    minecraft_launcher_lib::install_minecraft(app, config, tx).await?;

    app.set_profile_state(&item.profile_id, "INSTALLED").await?;
    app.set_queue_item_state(&item.id, "COMPLETED").await?;

    Ok(())
}

macro_rules! send_event {
    ($event_channel:expr,$event_name:literal, $($json:tt)+) => {
        if let Err(error) = $event_channel
        .send(ChannelMessage::new(
            $event_name,
            serde_json::json_internal!($($json)+).to_string(),
        ))
        .await
    {
        log::error!("{}", error);
    }
    };
}

pub fn setup_tauri(app: &mut App) -> Result<(), Box<dyn std::error::Error>> {
    let app_dir = app
        .path_resolver()
        .app_config_dir()
        .ok_or_else(|| Error::Generic("Failed to get config directory".to_string()))?;

    log::debug!("App config directory {:?}", app_dir);

    let state = tauri::async_runtime::block_on(async {
        let fqdb = create_db_path(&app_dir);
        log::debug!("Database connection string: {}", fqdb);
        if !Database::exists(&fqdb).await {
            log::info!("Create new database file");
            Database::create_db(&fqdb).await?;
        }

        let state = AppState::new(&fqdb)?;

        let migrations = app_dir.join("migrations");
        state.database.run_migrator(&migrations).await?;

        if !state.has_setting("path.app").await? {
            state
                .insert_setting("path.app", None, app_dir.to_string_lossy().to_string())
                .await?;
        }

        Ok::<_, LauncherError>(state)
    })?;

    app.manage(state);

    let handle = app.handle();
    tauri_plugin_deep_link::register("rmcl", move |request| {
        let items = request.split('?').collect::<Vec<&str>>();

        if items.len() < 2 {
            return;
        }

        let root = items[0];
        let payload = items[1];
        log::debug!("Deep Link: Root({}) Payload({})", root, payload);
        if let Err(err) = handle.emit_all(root, payload) {
            log::error!("{}", err);
        }
    })?;

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(50);
    let event = app.handle();
    tauri::async_runtime::spawn(async move {
        while let Some(msg) = rx.recv().await {
            log::debug!("{:#?}", msg);
            if let Err(err) = event.emit_to("main", "rmcl://download", msg) {
                log::error!("Failed to notify window: {}", err);
            }
        }
    });

    let dlq = app.handle();
    tauri::async_runtime::spawn(async move {
        let mut running = false;
        loop {
            tokio::time::sleep(Duration::from_secs(5)).await;
            let state = dlq.state::<AppState>();

            match state.get_next_item(running).await {
                Ok(Some(item)) => {
                    log::debug!("PROCESSING ITEM: {:#?}", item);
                    running = true;

                    match &item.content_type {
                        QueueType::Client => {
                            send_event!(tx, "refresh", {});
                            if let Err(err) = handle_client_install(&item, &state, &tx).await {
                                log::error!("{}", err);

                                if let Err(err) = tokio::try_join! {
                                    state.set_queue_item_state(&item.id, "ERRORED"),
                                    state.set_profile_state(&item.profile_id, "UNINSTALLED")
                                } {
                                    log::error!("{}", err);
                                }

                                send_event!(tx,"notify",{
                                    "message": "Install Error",
                                    "error": err.to_string(),
                                    "type": "error"
                                });
                            } else {
                                send_event!(tx,"notify",{
                                    "message": "Client Installed!",
                                    "type": "ok"
                                });
                            }
                        }
                        QueueType::Shader
                        | QueueType::Mod
                        | QueueType::Resource
                        | QueueType::Modpack => {
                            if let Err(err) = handle_content_install(&item, &state, &tx).await {
                                if let Err(error) =
                                    state.set_queue_item_state(&item.id, "ERRORED").await
                                {
                                    log::error!("{}", error);
                                }
                                log::error!("{}", err);
                            }
                        }

                        QueueType::Datapack => {}
                    }
                    send_event!(tx, "refresh", {});
                    send_event!(tx, "reset", {});
                    tokio::time::sleep(Duration::from_secs(60)).await;
                }
                Ok(None) => {}
                Err(err) => log::error!("{}", err),
            }
        }
    });

    Ok(())
}
