#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod commands;
mod errors;
mod handlers;
mod oauth;
mod plugins;
mod setup;

use tauri_plugin_log::{Target, TargetKind};

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_single_instance::init(
            plugins::single_instance::handle_instance,
        ))
        .plugin(
            tauri_plugin_log::Builder::new()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::LogDir { file_name: None }),
                ])
                .build(),
        )
        .plugin(plugins::query::init())
        .plugin(plugins::game::init())
        //.setup(setup::setup_tauri)
        /*.invoke_handler(tauri::generate_handler![
            commands::auth::start_auth_server,
            commands::auth::close_auth_server,
            commands::query::select,
            commands::query::execute,
            commands::game::launch_game,
            commands::game::is_running,
            commands::game::stop,
            commands::get_system_ram,
            commands::show_in_folder,
            commands::profile::delete_profile,
            commands::profile::copy_profile,
            commands::profile::create_profile,
            commands::profile::uninstall_content,
            commands::external::import_external,
        ])*/
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
