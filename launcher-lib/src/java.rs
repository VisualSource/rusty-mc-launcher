use crate::error::Result;
use std::path::Path;

/// Runs the the java program in library/JavaInfo.class
/// Returns the version of the jre bin that was pass to this function
pub async fn check_java(path: &Path) -> Result<Option<String>> {
    let temp_dir = std::env::temp_dir();

    let bytes = include_bytes!("../library/JavaInfo.class");
    let file_path = temp_dir.join("JavaInfo.class");

    tokio::fs::write(file_path, bytes).await?;

    let output = tokio::process::Command::new(path)
        .arg("-cp")
        .arg(temp_dir)
        .arg("JavaInfo")
        .output()
        .await?;

    let stdout = String::from_utf8_lossy(&output.stdout);
    let mut java_version = None;
    for line in stdout.lines() {
        let mut parts = line.split('=');
        let key = parts.next().unwrap_or_default();
        let value = parts.next().unwrap_or_default();

        if key == "java.version" {
            java_version = Some(value.to_string());
        }
    }

    Ok(java_version)
}
