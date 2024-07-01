use log::LevelFilter;
use minecraft_launcher_lib::{
    errors::LauncherError, models::QueueType, AppState, ChannelMessage, Database,
};
use std::time::Duration;
use tauri::{plugin::TauriPlugin, App, AppHandle, Manager, Wry};
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

use crate::handlers::{
    handle_client_install, handle_content_install, handle_external_pack_install,
};

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
        value.parse::<LevelFilter>().unwrap_or(LevelFilter::Warn)
    } else {
        LevelFilter::Warn
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

        let mut state = AppState::new(&fqdb)?;

        let migrations = app
            .path_resolver()
            .resolve_resource("./migrations")
            .ok_or_else(|| LauncherError::Generic("Failed to get config directory".to_string()))?;
        state.database.run_migrator(&migrations).await?;

        if !state.has_setting("path.app").await? {
            state
                .insert_setting("path.app", None, app_dir.to_string_lossy().to_string())
                .await?;
        }

        state.rescue_instances_cache().await?;

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

    let (ev_q, mut rx) = tokio::sync::mpsc::channel::<ChannelMessage>(50);
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
    let tx = ev_q.clone();
    tauri::async_runtime::spawn(async move {
        let mut running = false;
        loop {
            tokio::time::sleep(Duration::from_secs(5)).await;
            let state = dlq.state::<AppState>();
            match state.get_next_item(running).await {
                Ok(Some(item)) => {
                    log::debug!("PROCESSING ITEM: {:#?}", item);
                    running = true;
                    send_event!(tx, "refresh", {});
                    match &item.content_type {
                        QueueType::Client => {
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
                                send_event!(tx,"done",{
                                    "keys": ["profile",item.id],
                                });
                                send_event!(tx,"notify",{
                                    "message": "Client Installed!",
                                    "type": "ok"
                                });
                            }
                        }
                        QueueType::CurseforgeModpack => {
                            if let Err(err) = handle_external_pack_install(&item, &state, &tx).await
                            {
                                if let Err(error) =
                                    state.set_queue_item_state(&item.id, "ERRORED").await
                                {
                                    log::error!("{}", error);
                                }
                                log::error!("{}", err);
                                send_event!(tx,"notify",{
                                    "message": "Install Error",
                                    "error": err.to_string(),
                                    "type": "error"
                                });
                            } else {
                                send_event!(tx,"notify",{
                                    "message": "Content Installed!",
                                    "type": "ok"
                                });
                            }
                        }
                        QueueType::Shader
                        | QueueType::Mod
                        | QueueType::Resourcepack
                        | QueueType::Modpack => {
                            if let Err(err) = handle_content_install(&item, &state, &tx).await {
                                if let Err(error) =
                                    state.set_queue_item_state(&item.id, "ERRORED").await
                                {
                                    log::error!("{}", error);
                                }
                                log::error!("{}", err);
                                send_event!(tx,"notify",{
                                    "message": "Install Error",
                                    "error": err.to_string(),
                                    "type": "error"
                                });
                            } else {
                                send_event!(tx,"notify",{
                                    "message": "Content Installed!",
                                    "type": "ok"
                                });
                                send_event!(tx,"done",{
                                    "keys": ["WORKSHOP_CONTENT",item.content_type,item.profile_id],
                                });
                            }
                        }

                        QueueType::Datapack => {
                            if let Err(error) =
                                state.set_queue_item_state(&item.id, "ERRORED").await
                            {
                                log::error!("{}", error);
                            }
                        }
                    }
                    send_event!(tx, "refresh", {});
                    send_event!(tx, "reset", {});
                    tokio::time::sleep(Duration::from_secs(30)).await;
                }
                Ok(None) => {}
                Err(err) => log::error!("Queue Error: {}", err),
            }
        }
    });

    /*let cc = app.handle();
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(10)).await;

            let state = cc.state::<AppState>();

            match state.instances.running_profiles_ids().await {
                Ok(instances) => {
                    log::info!("{:#?}", instances);
                    /*for instance in instances {
                        match state.instances.exit_status(&instance).await {
                            Ok(status) => {
                                if let Some(status) = status {
                                    if status != 0 {
                                        send_event!(ev_q, "game_crash", { "status": status, "instance": instance });
                                    }

                                    if let Err(err) =
                                        state.instances.stop_process(&state, instance).await
                                    {
                                        log::error!("{}", err);
                                    };
                                }
                            }
                            Err(err) => log::error!("{}", err),
                        }
                    }*/
                }
                Err(err) => log::error!("{}", err),
            }
        }
    });*/

    Ok(())
}
