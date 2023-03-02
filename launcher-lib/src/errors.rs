use thiserror::Error;

#[derive(Error,Debug)]
pub enum LauncherLibError {
    #[error("HTTP Error | {0}")]
    Http(#[from] reqwest::Error),
    #[error("IOERROR | {0}")]
    IoError(#[from] std::io::Error),
    #[error("Parse Error | {0}")]
    SerdeError(#[from] serde_json::Error),
    #[error("Regex Error | {0}")]
    RegexError(#[from] regex::Error),
    #[error("Could not find {0}.")]
    NotFound(String),
    #[error("An error has happened. {0}")]
    Generic(String),
    #[error("ZipError | {0}")]
    ZipError(#[from] async_zip::error::ZipError),
    #[error("Failed sha1 check")]
    Sha1Error,
    #[error("{0}")]
    TimeError(#[from] std::time::SystemTimeError)
}