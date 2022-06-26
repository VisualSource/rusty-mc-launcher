#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod consts;

use commands::{news, mc_versions, login, minecraft, run, install, logger};
use consts::APP_INFO;

fn main() -> std::io::Result<()> {
  // init app root
  // and setup logger

  if let Err(err) = app_dirs2::app_root( app_dirs2::AppDataType::UserConfig , &APP_INFO) {
      return Err(std::io::Error::new(std::io::ErrorKind::Other, err));
  }
  
  log4rs::init_raw_config(serde_yaml::from_str(include_str!("log4rs.yml")).unwrap()).unwrap();

  tauri::Builder::default()
  .invoke_handler(tauri::generate_handler![
    news::news,
    minecraft::game_dir,
    mc_versions::get_vanilla_versions,
    mc_versions::get_loader_versions,
    login::login,
    login::login_done,
    login::logout,
    login::token_refresh,
    login::logout_done,
    login::auth_error,
    minecraft::check_version,
    minecraft::sawp_mods_folders,
    minecraft::remove_mods_folder,
    run::run_minecraft,
    install::install_client,
    install::install_natives,
    install::install_mods_list,
    install::update_mods_list,
    logger::log
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
    Ok(())
}
