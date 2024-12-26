#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod error;
mod plugins;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(
            plugins::single_instance::handle_instance,
        ))
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .level_for("tao", log::LevelFilter::Off)
                .level_for("sqlx", log::LevelFilter::Off)
                .level_for("hyper_util", log::LevelFilter::Off)
                .build(),
        )
        .plugin(plugins::query::init())
        .plugin(plugins::content::init())
        .plugin(plugins::game::init())
        .plugin(plugins::auth::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
