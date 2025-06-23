pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error("invalid maven: {0}")]
    InvalidMavenPackage(String),
    #[error("failed to find: {0}")]
    NotFound(String),

    #[error(transparent)]
    SerdeJson(#[from] serde_json::Error),
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error("{0}")]
    Semver(String),
}
