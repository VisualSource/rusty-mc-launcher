mod commands;
use minecraft_launcher_lib::database::{Database, RwDatabase};
use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};
use tokio::sync::RwLock;

pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::<R>::new("rmcl-query")
        .setup(|app, _api| {
            log::debug!("Setup <rmcl-query> plugin");

            let config_dir = app.path().app_config_dir()?;
            let migration_path = app
                .path()
                .resolve("migrations", tauri::path::BaseDirectory::Resource)?;

            let db = tauri::async_runtime::block_on(async {
                let db = Database::new(&config_dir, "database.db").await?;
                log::debug!("Running migrations");
                db.run_migrations(&migration_path).await?;

                Ok::<Database, minecraft_launcher_lib::error::Error>(db)
            })?;

            app.manage(RwLock::new(db));

            log::debug!("Starting up database.");

            Ok(())
        })
        .on_event(|app, event| {
            if let tauri::RunEvent::Exit = event {
                let store = app.state::<RwDatabase>();
                tauri::async_runtime::block_on(async {
                    let db = store.write().await;
                    db.close().await;
                });
            }
        })
        .invoke_handler(tauri::generate_handler![
            commands::execute,
            commands::select,
        ])
        .build()
}
