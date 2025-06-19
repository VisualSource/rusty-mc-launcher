use serde::{Serialize, ser::Serializer};

pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Sqlx(#[from] sqlx::Error),
    #[error(transparent)]
    SqlxMigration(#[from] sqlx::migrate::MigrateError),

    #[error(transparent)]
    TimeFormat(#[from] time::error::Format),

    #[error(transparent)]
    Uuid(#[from] uuid::Error),

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

impl Serialize for Error {
    fn serialize<S>(&self, serializer: S) -> std::result::Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}
