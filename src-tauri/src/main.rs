#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod error;
mod plugins;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            let log_dir = app.path().app_data_dir()?.join("logs");

            let logger = tauri_plugin_log::Builder::new()
                .clear_targets()
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Stdout,
                ))
                .target(tauri_plugin_log::Target::new(
                    tauri_plugin_log::TargetKind::Folder {
                        path: log_dir,
                        file_name: None,
                    },
                ))
                .level_for("tao", log::LevelFilter::Off)
                .level_for("sqlx", log::LevelFilter::Off)
                .level_for("hyper_util", log::LevelFilter::Off)
                .build();

            handle.plugin(logger)?;

            Ok(())
        })
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
        .plugin(plugins::query::init())
        .plugin(plugins::content::init())
        .plugin(plugins::game::init())
        .plugin(plugins::auth::init())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
