#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod oauth;
mod state;

use log::LevelFilter;
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

const DEFAULT_TIMEZONE_STRATEGY: TimezoneStrategy = TimezoneStrategy::UseUtc;

fn main() {
    let level = if let Some(value) = option_env!("MCL_LOG") {
        value
            .parse::<LevelFilter>()
            .unwrap_or_else(|_| LevelFilter::Error)
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
        .plugin(tauri_plugin_sqlite::init())
        .plugin(logger)
        .manage(state::TauriState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            commands::start_auth_server,
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
