use tauri::{AppHandle, Manager};

pub fn handle_instance(app: &AppHandle, _args: Vec<String>, _cwd: String) {
    show_window(app);
}

fn show_window(app: &AppHandle) {
    let windows = app.webview_windows();

    if let Some(window) = windows.values().next() {
        if let Err(err) = window.set_focus() {
            log::error!("{}", err);
        }
    }
}
