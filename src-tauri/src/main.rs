#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod state;

use log::LevelFilter;
use tauri_plugin_log::{LogTarget, TimezoneStrategy};

const DEFAULT_TIMEZONE_STRATEGY: TimezoneStrategy = TimezoneStrategy::UseUtc;

fn main() {
    let level = if let Some(value) = option_env!("MCL_LOG") {
        value
            .parse::<LevelFilter>()
            .unwrap_or_else(|_| LevelFilter::Info)
    } else {
        LevelFilter::Info
    };

    let logger = tauri_plugin_log::Builder::new()
        .level(level)
        .format(move |out, message, record| {
            let time = DEFAULT_TIMEZONE_STRATEGY.get_now();

            out.finish(format_args!(
                "[{}-{}-{}:{}:{}:{}][{}] {}",
                time.year(),
                time.month(),
                time.day(),
                time.hour(),
                time.minute(),
                time.second(),
                record.level(),
                message
            ))
        })
        .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
        .build();

    tauri::Builder::default()
        .plugin(tauri_plugin_sqlite::init())
        .plugin(logger)
        .manage(state::TauriState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            commands::play,
            commands::get_minecraft_dir,
            commands::stop,
            commands::install,
            commands::check_install,
            commands::start_server,
            commands::install_mods,
            commands::install_pack,
            commands::is_game_running
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
