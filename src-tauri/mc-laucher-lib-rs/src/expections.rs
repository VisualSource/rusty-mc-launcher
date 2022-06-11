use thiserror::Error;

#[derive(Error,Debug)]
pub enum LauncherLibError {
  #[error("Minecraft Launcher Lib | OS Error | {msg} | {source}")]
  OS {
    msg: String,
    #[source] 
    source: std::io::Error
  },
  #[error("Minecraft Launcher Lib | ENV Error | {msg} | {source}")]
  ENV {
    msg: String,
    #[source] 
    source: std::env::VarError
  },
  #[error("Minecraft Launcher Lib | Zip Error | {0}")]
  ZipError(#[from] zip::result::ZipError),
  #[error("Minecraft Launcher Lib | Unsupported | {0}")]
  Unsupported(String),
  #[error("Minecraft Launcher Lib | Http Error | {msg} | {source}")]
  HTTP {
      msg: String,
      #[source]
      source: reqwest::Error
  },
  #[error("Minecraft Launcher Lib | Parse Json Error | {0}")]
  PraseJsonReqwest(#[from] reqwest::Error),
  #[error("Minecraft Launcher Lib | Parse Json Error | {0}")]
  ParseJsonSerde(#[from] serde_json::Error),
  #[error("Minecraft Launcher Lib | Not Found Error | {0}")]
  NotFound(String),
  #[error("Minecraft Launcher Lib | General | {0}")]
  General(String)
}

pub type LibResult<T> = Result<T,LauncherLibError>;

