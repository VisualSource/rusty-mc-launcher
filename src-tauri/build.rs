fn main() {
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .plugin(
                "rmcl-auth",
                tauri_build::InlinedPlugin::new()
                    .permissions_path_pattern("./permissions/rmcl-auth/**/*"),
            )
            .plugin(
                "rmcl-query",
                tauri_build::InlinedPlugin::new()
                    .permissions_path_pattern("./permissions/rmcl-query/**/*"),
            )
            .plugin(
                "rmcl-game",
                tauri_build::InlinedPlugin::new()
                    .permissions_path_pattern("./permissions/rmcl-game/**/*"),
            )
            .plugin(
                "rmcl-content",
                tauri_build::InlinedPlugin::new()
                    .permissions_path_pattern("./permissions/rmcl-content/**/*"),
            ),
    )
    .expect("failed to run tauri-build")
}
