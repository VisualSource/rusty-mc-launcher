use thiserror::Error;

#[derive(Error, Debug)]
pub enum LauncherError {
    #[error(transparent)]
    Sqlite(#[from] sqlite::Error),

    #[error(transparent)]
    Http(#[from] reqwest::Error),
    #[error(transparent)]
    IoError(#[from] std::io::Error),
    #[error(transparent)]
    SerdeError(#[from] serde_json::Error),
    #[error(transparent)]
    RegexError(#[from] regex::Error),
    #[error("Could not find {0}.")]
    NotFound(String),
    #[error("An error has happened. {0}")]
    Generic(String),
    #[error(transparent)]
    ZipError(#[from] async_zip::error::ZipError),
    #[error("Failed sha1 check")]
    Sha1Error,
    #[error(transparent)]
    TimeError(#[from] std::time::SystemTimeError),
    #[error("Failed to convert pathbuf to str")]
    PathBufError,
    #[error(transparent)]
    VarError(#[from] std::env::VarError),
}
