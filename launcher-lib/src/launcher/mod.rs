pub mod arguments;
mod state;
use crate::{errors::LauncherError, manifest::Manifest};
use normalize_path::NormalizePath;
use std::{collections::HashMap, path::PathBuf};

use self::{arguments::Arguments, state::State};
pub struct Config {
    pub console: bool,
    pub runtime_directory: PathBuf,
    pub game_directory: PathBuf,
    pub version: String, //pub arguments: HashMap<String, String>,
}

pub async fn start_game(config: Config) -> Result<(), LauncherError> {
    let assets_root = config.runtime_directory.join("assets").normalize();
    if !assets_root.exists() || !assets_root.is_dir() {
        return Err(LauncherError::NotFound(
            "Assets Directory was not found".into(),
        ));
    }

    let natives_directory = config
        .runtime_directory
        .join("natives")
        .join(&config.version)
        .normalize();
    if !natives_directory.exists() || !natives_directory.is_dir() {
        return Err(LauncherError::NotFound(
            "Natives directory was not found".into(),
        ));
    }

    let game_directory = config.game_directory.normalize();
    if !game_directory.exists() || !game_directory.is_dir() {
        return Err(LauncherError::NotFound(
            "Game directory was not found".into(),
        ));
    }

    let manifest_directory = config
        .runtime_directory
        .join("versions")
        .join(&config.version)
        .join(format!("{}.json", &config.version))
        .normalize();
    if !manifest_directory.exists() || !manifest_directory.is_file() {
        return Err(LauncherError::NotFound(format!(
            "Manifest directory was not found: ({})",
            manifest_directory.to_string_lossy()
        )));
    }
    let manifest = Manifest::read_manifest(&manifest_directory, true).await?;

    let classpath = manifest.libs_as_string(&config.runtime_directory, &config.version)?;

    let arguments = std::collections::HashMap::<String, String>::from_iter([
        (
            "clientid".to_string(),
            "c4502edb-87c6-40cb-b595-64a280cf8906".to_string(),
        ),
        (
            "game_directory".to_string(),
            game_directory.to_string_lossy().to_string(),
        ),
        (
            "natives_directory".to_string(),
            natives_directory.to_string_lossy().to_string(),
        ),
        (
            "assets_root".to_string(),
            assets_root.to_string_lossy().to_string(),
        ),
        ("user_type".to_string(), "msa".to_string()),
        ("classpath".to_string(), classpath),
        (
            "assets_index_name".to_string(),
            manifest.assets.ok_or(LauncherError::NotFound(
                "Failed to get assets index".to_string(),
            ))?,
        ),
        ("version_type".to_string(), manifest.release_type),
        ("version_name".to_string(), manifest.id),
    ]);

    let state = State::from_config(&arguments);

    let game_args = Arguments::parse_args(&manifest.arguments.game, &state, &arguments);
    let jvm_args = Arguments::parse_args(&manifest.arguments.jvm, &state, &arguments);

    // exec_path + jvmArgs+ (client jvm args) + logging + mainClass + gameFlags + ?(extraFlags)

    let mut output = vec![];

    let java_version = manifest.java_version.ok_or(LauncherError::NotFound(
        "Failed to get java runtime.".to_string(),
    ))?;

    output.extend(jvm_args);
    // add exrta jvm args

    // logging

    output.push(manifest.main_class);

    output.extend(game_args);

    println!("{:#?}", output);

    Ok(())
}
#[cfg(test)]
mod tests {
    use std::{path::PathBuf, str::FromStr};
    #[tokio::test]
    async fn test_start() {
        let config = super::Config {
            console: false,
            runtime_directory: PathBuf::from_str(
                "C:\\Users\\Collin\\AppData\\Roaming\\com.modrinth.theseus\\meta",
            )
            .expect("Failed to create path"),
            game_directory: PathBuf::from_str(
                "C:\\Users\\Collin\\AppData\\Roaming\\com.modrinth.theseus\\profiles\\g",
            )
            .expect("Failed to create path"),
            version: "1.20.6".to_string(),
        };

        super::start_game(config)
            .await
            .expect("Failed to build string");
    }
}
