#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
mod commands;
mod errors;
mod oauth;
mod setup;

fn main() {
    // deep link
    tauri_plugin_deep_link::prepare("us.visualsource.rmcl");

    let logger = setup::init_logger();

    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(setup::single_instance))
        .plugin(logger)
        .setup(setup::setup_tauri)
        .invoke_handler(tauri::generate_handler![
            commands::auth::start_auth_server,
            commands::auth::close_auth_server,
            commands::query::select,
            commands::query::execute,
            commands::game::launch_game,
            commands::game::is_running,
            commands::game::stop,
            commands::show_in_folder,
            commands::profile::delete_profile,
            commands::profile::copy_profile,
            commands::profile::create_profile,
            commands::profile::uninstall_content
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
