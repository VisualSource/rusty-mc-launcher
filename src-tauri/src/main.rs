#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod oauth;
mod state;

use log::LevelFilter;
use tauri::Manager;
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

const DEFAULT_TIMEZONE_STRATEGY: TimezoneStrategy = TimezoneStrategy::UseUtc;

#[derive(Clone, serde::Serialize)]
struct Payload {
    args: Vec<String>,
    cwd: String,
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
        .plugin(tauri_plugin_sqlite::init())
        .plugin(logger)
        .setup(|app| {
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

            Ok(())
        })
        .manage(state::TauriState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            commands::start_auth_server,
            commands::close_auth_server,
            commands::play,
            commands::stop,
            commands::is_game_running,
            commands::get_minecraft_dir,
            commands::validate_game_files,
            commands::validate_mods_files,
            commands::validate_modpack_files,
            commands::validate_pack_files,
            commands::install_game,
            commands::install_modpack,
            commands::install_mods,
            commands::install_pack,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
