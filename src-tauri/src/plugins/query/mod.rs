mod commands;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

fn create_db_path(path: &std::path::Path) -> String {
    let database_file = path.join("database.db");
    let db_str = database_file.to_string_lossy().to_string();
    let no_dive = db_str
        .split_once(':')
        .expect("Failed to parse connection string for database!")
        .1;

    format!("sqlite:{}", no_dive)
}

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-query")
        .setup(|app, api| {
            // setup mirgraions
            let config_dir = app.path().app_config_dir()?;
            let fqdb = create_db_path(&config_dir);
            log::debug!("Starting up database. Using db at: {}", fqdb);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::select,
            commands::execute,
        ])
        .build()
}
