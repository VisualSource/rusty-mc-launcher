#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
mod error;
mod plugins;
use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            let handle = app.handle();

            let root = app.path().app_data_dir()?;
            if !root.exists() {
                std::fs::create_dir_all(&root)?;
            }

            let log_dir = root.join("logs");
            let level = match std::env::var("MCL_LOG") {
                Ok(value) => {
                    let target = value.to_lowercase();
                    match target.as_str() {
                        "error" => log::LevelFilter::Error,
                        "debug" => log::LevelFilter::Debug,
                        "trace" => log::LevelFilter::Trace,
                        "warn" => log::LevelFilter::Warn,
                        _ => log::LevelFilter::Info,
                    }
                }
                Err(_) => log::LevelFilter::Info,
            };

            let logger = tauri_plugin_log::Builder::new()
                .level(level)
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
            handle.plugin(tauri_plugin_single_instance::init(
                plugins::single_instance::handle_instance,
            ))?;
            handle.plugin(tauri_plugin_updater::Builder::new().build())?;
            handle.plugin(tauri_plugin_dialog::init())?;

            handle.plugin(tauri_plugin_dialog::init())?;
            handle.plugin(tauri_plugin_fs::init())?;
            handle.plugin(tauri_plugin_http::init())?;
            handle.plugin(tauri_plugin_opener::init())?;
            handle.plugin(tauri_plugin_process::init())?;
            handle.plugin(tauri_plugin_shell::init())?;
            handle.plugin(tauri_plugin_deep_link::init())?;
            handle.plugin(plugins::query::init())?;
            handle.plugin(plugins::content::init())?;
            handle.plugin(plugins::game::init())?;
            handle.plugin(plugins::auth::init())?;

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
