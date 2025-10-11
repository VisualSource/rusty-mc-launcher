pub type Result<T> = std::result::Result<T, Error>;

#[derive(Debug, thiserror::Error)]
pub enum Error {
    #[error(transparent)]
    Io(#[from] std::io::Error),

    #[error(transparent)]
    Reqwest(#[from] reqwest::Error),

    #[error("The given url is invalid: '{0}'")]
    InvalidDownloadUrl(String),

    #[error("{0}")]
    FileDownload(String),
}
