#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod state;
use log4rs;

fn main() {
    log4rs::init_file("log4rs.yml", Default::default()).expect("Failed to boot logger");

    tauri::Builder::default()
        .plugin(tauri_plugin_sqlite::init())
        .manage(state::TauriState(Default::default()))
        .invoke_handler(tauri::generate_handler![
            commands::play,
            commands::close_splashscreen,
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
