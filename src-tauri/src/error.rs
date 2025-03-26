use openidconnect::core::CoreErrorResponseType;
use serde::{Serialize, ser::Serializer};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Lib(#[from] minecraft_launcher_lib::error::Error),

    #[error(transparent)]
    Tauri(#[from] tauri::Error),
    #[error(transparent)]
    TauriOpener(#[from] tauri_plugin_opener::Error),
    #[error(transparent)]
    TauriHttp(#[from] tauri_plugin_http::reqwest::Error),

    #[error("{}: {}",_0.error(),_0.error_description().cloned().unwrap_or_default())]
    Auth(openidconnect::StandardErrorResponse<CoreErrorResponseType>),

    #[error(transparent)]
    AuthUrlParse(#[from] openidconnect::url::ParseError),
    #[error(transparent)]
    AuthSignature(#[from] openidconnect::SignatureVerificationError),
    #[error(transparent)]
    AuthClaims(#[from] openidconnect::ClaimsVerificationError),
    #[error(transparent)]
    AuthSigning(#[from] openidconnect::SigningError),

    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),

    #[error("{0}")]
    Reason(String),
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[cfg(mobile)]
    #[error(transparent)]
    PluginInvoke(#[from] tauri::plugin::mobile::PluginInvokeError),
}

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
