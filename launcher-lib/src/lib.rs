pub mod database;
/// Minecraft rust launcher library for launcher minecraft with/without mods
/// https://ryanccn.dev/posts/inside-a-minecraft-launcher/
pub mod error;
pub mod events;
pub mod installer;
pub mod java;
mod launcher;
mod manifest;
pub mod process;
mod state;
//mod utils;

/// Get ram in GB
pub fn get_ram() -> u64 {
    let info = sysinfo::System::new_all();

    info.total_memory() / 1000000000
}

pub use installer::{content, install_minecraft, ChannelMessage, InstallConfig};
pub use launcher::{start_game, LaunchConfig};
pub use state::{models, profile, AppState};
