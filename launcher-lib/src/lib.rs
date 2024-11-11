//! utily library for downloading the minecraft client along with
//! utils for installing modloaders,mods,resourcepacks,shaderpacks

pub mod database;
pub mod error;
pub mod events;
pub mod installer;
mod java;
pub mod launcher;
mod manifest;
pub mod models;
pub mod process;

/// Get ram in GB
pub fn get_ram() -> u64 {
    let info = sysinfo::System::new_all();
    info.total_memory() / 1000000000
}
