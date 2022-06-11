#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod commands;
mod consts;

use app_dirs2::{ app_root , AppDataType};
use commands::{news, game_dir, mc_versions, login, check, run, install};

fn main() {

  // init app root
  match app_root(AppDataType::UserConfig, &consts::APP_INFO) {
    Ok(value) => {
      if let Err(err) = log4rs::init_file(value.join("log4rs.yml"), Default::default()) {
        eprintln!("{}",err);
      }
    }
    Err(err) => eprintln!("{}",err)
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
    install::install_client
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
