#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod consts;

use log4rs::{ 
  init_config,
  append::file::FileAppender, 
  encode::pattern::{
    PatternEncoder
  }, 
  config::{Config, Appender, Root}
};
use app_dirs2::{ app_root , AppDataType};
use commands::{news, game_dir, mc_versions, login, check, run, install, logger};

fn main() -> std::io::Result<()> {
  use std::io::{Error, ErrorKind};
  // init app root
  // and setup logger
  match app_root(AppDataType::UserConfig, &consts::APP_INFO) {
    Ok(value) => {
      let log_level = log::LevelFilter::Debug;
      let log_file = value.join("logs/latest.log");
   
      let logger = match FileAppender::builder()
      .encoder(Box::new(PatternEncoder::new("[{d(%Y-%m-%d %H:%M:%S %Z)(utc)}][{M}][{l}] | {m} \n")))
      .build(log_file) {
        Ok(value) => value,
        Err(err) => return Err(Error::new(ErrorKind::Other, err))
      };
   
      let config = match Config::builder()
      .appender(Appender::builder().build("logger",Box::new(logger))).build(
        Root::builder().appender("logger").build(log_level)
      ) {
        Ok(value) => value,
        Err(err) => return Err(Error::new(ErrorKind::Other,err))
      };

      if let Err(err) = init_config(config) {
        return Err(Error::new(ErrorKind::Other,err));
      }
    }
    Err(err) => return Err(Error::new(ErrorKind::Other,err))
  }

  tauri::Builder::default()
  .invoke_handler(tauri::generate_handler![
    news::news,
    game_dir::game_dir,
    mc_versions::get_vanilla_versions,
    mc_versions::get_loader_versions,
    login::login,
    login::login_done,
    login::logout,
    login::token_refresh,
    login::logout_done,
    login::auth_error,
    check::check_version,
    run::run_minecraft,
    install::install_client,
    logger::error
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
    Ok(())
}
