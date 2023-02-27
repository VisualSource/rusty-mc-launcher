use thiserror::Error;

#[derive(Error,Debug)]
pub enum LauncherLibError {
    #[error("Internal Http Error")]
    Http(#[from] reqwest::Error),
    #[error("Could not find {0}.")]
    NotFound(String)
}