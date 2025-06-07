use std::collections::HashMap;

use crate::error::{Error, Result};
use openidconnect::CsrfToken;
use serde::{Deserialize, Serialize};
use tauri::{Emitter, Manager, State, Url, WebviewUrl, WebviewWindowBuilder, WindowEvent};

const MODRINTH_CALLBACK: &str = "rmcl://modrinth/authorize";
pub const EVENT_MR_LOGIN_WINDOW_DESTORYED: &str = "mrcl-auth-rm-login-window-destory";

#[derive(Debug)]
pub struct ModrinthLoginState(Option<String>);

impl ModrinthLoginState {
    pub fn new() -> Self {
        Self(None)
    }
    fn set_state(&mut self, value: String) -> Result<()> {
        if self.0.is_some() {
            return Err(Error::Reason("State is in use".into()));
        }

        self.0 = Some(value);

        Ok(())
    }

    pub fn reset(&mut self) -> Result<()> {
        self.0 = None;

        Ok(())
    }

    fn is_same(&self, value: &str) -> bool {
        self.0.as_ref().map(|f| f == value).unwrap_or_default()
    }
}

#[tauri::command]
pub async fn mr_authenticate<R: tauri::Runtime>(
    app: tauri::AppHandle<R>,
    state: State<'_, tokio::sync::Mutex<ModrinthLoginState>>,
) -> Result<()> {
    if let Some(window) = app.get_webview_window("rm-login") {
        if let Err(err) = window.close() {
            log::error!("{}", err);
        }
    }
    let csrf = CsrfToken::new_random();
    let token = csrf.into_secret();

    let mut s = state.lock().await;
    s.set_state(token.clone())?;

    let url = Url::parse_with_params(
        "https://modrinth.com/auth/authorize",
        &[
            ("response_type", "code"),
            ("client_id", env!("VITE_MODRINTH_CLIENT_ID")),
            ("scope", env!("VITE_MODRINTH_SCOPES")),
            ("state", &token),
            ("redirect_uri", MODRINTH_CALLBACK),
        ],
    )?;

    let window = WebviewWindowBuilder::new(&app, "rm-login", WebviewUrl::External(url))
        .title("Login")
        .inner_size(484.0, 600.0)
        .focused(true)
        .center()
        .build()?;

    let handle = app.clone();
    window.on_window_event(move |event| {
        if let WindowEvent::Destroyed = event {
            if let Err(err) = handle.emit(EVENT_MR_LOGIN_WINDOW_DESTORYED, ()) {
                log::error!("{}", err);
            };
        }
    });

    Ok(())
}

pub fn is_modrinth_callback(url: &Url) -> bool {
    url.as_str().starts_with(MODRINTH_CALLBACK)
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ModrinthLoginResponse {
    access_token: String,
    token_type: String,
    expires_in: u64,
}

pub async fn validate_modrinth_code<R>(app: tauri::AppHandle<R>, url: Url) -> Result<()>
where
    R: tauri::Runtime,
{
    let result = {
        let hash_query: HashMap<_, _> = url.query_pairs().into_owned().collect();
        let code = hash_query
            .get("code")
            .ok_or(Error::Reason("Failed to get param".into()))?;
        let token = hash_query
            .get("state")
            .ok_or(Error::Reason("Failed to get crsf".into()))?;

        let state = app.state::<tokio::sync::Mutex<ModrinthLoginState>>();
        let l = state.lock().await;
        let valid_csrf = l.is_same(token);

        if !valid_csrf {
            return Err(Error::Reason("crsf failed".into()));
        }

        let http_client = tauri_plugin_http::reqwest::ClientBuilder::new().build()?;

        let response = http_client
            .post("https://api.modrinth.com/_internal/oauth/token")
            .header("Authorization", env!("VITE_MODRINTH_CLIENT_SECRET"))
            .form(&[
                ("code", code.as_str()),
                ("client_id", env!("VITE_MODRINTH_CLIENT_ID")),
                ("redirect_uri", MODRINTH_CALLBACK),
                ("grant_type", "authorization_code"),
            ])
            .send()
            .await?;

        if !response.status().is_success() {
            return Err(Error::Reason("request failed".to_string()));
        }

        let payload = response.json::<ModrinthLoginResponse>().await?;

        Ok::<_, Error>(payload)
    };

    match result {
        Ok(data) => {
            if let Err(err) = app.emit("rmcl-auth-login-rm-success", data) {
                log::error!("{}", err);
            }
        }
        Err(err) => {
            log::error!("{}", err);
            if let Err(err) = app.emit("rmcl-auth-login-mr-error", err.to_string()) {
                log::error!("{}", err);
            }
        }
    }

    if let Some(win) = app.get_webview_window("rm-login") {
        if let Err(err) = win.close() {
            log::error!("{}", err);
        }
    }

    Ok(())
}
