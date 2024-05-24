#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod oauth;

use std::time::Duration;

use log::LevelFilter;
use minecraft_launcher_lib::{errors::LauncherError, AppState, Database};
use tauri::Manager;
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

const DEFAULT_TIMEZONE_STRATEGY: TimezoneStrategy = TimezoneStrategy::UseUtc;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
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

fn main() {
    // deep link
    tauri_plugin_deep_link::prepare("us.visualsource.rmcl");

    // Setup logger
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

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            if let Err(err) = app.emit_all("rmcl://start", Payload { args: argv, cwd }) {
                log::error!("{}", err);
            }
        }))
        .plugin(logger)
        .setup(|app| {
            let app_dir = app
                .path_resolver()
                .app_config_dir()
                .expect("Failed to get app directory");
            log::debug!("App directory {:?}", app_dir);
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
            })
            .expect("Failed to init state");

            app.manage(state);

            let handle = app.handle();
            tauri_plugin_deep_link::register("rmcl", move |request| {
                let items = request.split('?').collect::<Vec<&str>>();

                if items.len() < 2 {
                    return;
                }

                let root = items[0];
                let payload = items[1];
                log::info!("Deep Link: Root({}) Payload({})", root, payload);
                if let Err(err) = handle.emit_all(root, payload) {
                    log::error!("{}", err);
                }
            })
            .expect("Failed to register deep linker");

            let dlq = app.handle();
            tauri::async_runtime::spawn(async move {
                loop {
                    tokio::time::sleep(Duration::from_secs(4)).await;

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
        })
        .invoke_handler(tauri::generate_handler![
            commands::auth::start_auth_server,
            commands::auth::close_auth_server,
            commands::query::select,
            commands::query::execute,
            commands::game::launch_game,
            commands::game::is_running,
            commands::game::stop,
            commands::game::install_game,
            commands::game::install_workshop_content,
            commands::game::install_local_mrpack,
            commands::show_in_folder,
            commands::profile::delete_profile,
            commands::profile::create_profile
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
