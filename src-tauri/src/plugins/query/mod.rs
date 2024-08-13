mod commands;
use minecraft_launcher_lib::Database;
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};
use tokio::sync::RwLock;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-query")
        .setup(|app, _api| {
            log::debug!("Setup <rmcl-game> plugin");
            // setup mirgraions
            let config_dir = app.path().app_config_dir()?;
            let migration_path = app
                .path()
                .resolve("migrations", tauri::path::BaseDirectory::Resource)?;

            let db = tauri::async_runtime::block_on(async {
                let db = Database::new_from_path(&config_dir, "database.db")?;
                db.run_migrator(&migration_path).await?;

                Ok(db)
            })?;

            app.manage(RwLock::new(db));

            log::debug!("Starting up database.");

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::select,
            commands::execute,
        ])
        .build()
}
