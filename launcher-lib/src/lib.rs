/// Minecraft rust launcher library for launcher minecraft with/without mods
/// https://ryanccn.dev/posts/inside-a-minecraft-launcher/
pub mod errors;
pub mod installer;
mod launcher;
mod manifest;
mod state;
//mod utils;

pub use installer::install_minecraft;
pub use launcher::{start_game, LaunchConfig};
pub use state::AppState;
