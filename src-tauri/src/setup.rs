use log::LevelFilter;
use minecraft_launcher_lib::{errors::LauncherError, AppState, Database};
use std::time::Duration;
use tauri::{plugin::TauriPlugin, App, AppHandle, EventLoopMessage, Manager, Wry};
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

    let dlq = app.handle();
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(5)).await;

            let state = dlq.state::<AppState>();

            match state.get_next_item().await {
                Ok(Some(item)) => {
                    log::debug!("PROCESSING ITEM: {:#?}", item);
                    tokio::time::sleep(Duration::from_secs(60)).await;
                }
                Ok(None) => {}
                Err(err) => log::error!("{}", err),
            }
        }
    });

    Ok(())
}
