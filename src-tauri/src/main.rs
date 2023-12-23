#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod state;

use log::LevelFilter;
use tauri_plugin_log::LogTarget;

fn main() {
    let logger = tauri_plugin_log::Builder::new()
        .level(LevelFilter::Debug)
        .format(|out, message, record| out.finish(format_args!("[{}] {}", record.level(), message)))
        .targets([LogTarget::LogDir, LogTarget::Stdout, LogTarget::Webview])
        .build();

    tauri::Builder::default()
        .plugin(tauri_plugin_sqlite::init())
        .plugin(logger)
        .manage(state::TauriState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            commands::play,
            commands::close_splashscreen,
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
