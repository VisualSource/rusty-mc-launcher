use std::path::PathBuf;

use super::ContentType;
use crate::{
    database::RwDatabase,
    error::{Error, Result},
    installer::utils::get_file_hash,
    models::setting::Setting,
};

/// #### Import a local file.
/// Adds file to db and copies file to profile.
pub async fn install_file(
    db: &RwDatabase,
    src: PathBuf,
    profile: String,
    content_type: ContentType,
) -> Result<()> {
    let root = Setting::path("path.app", db)
        .await?
        .ok_or_else(|| Error::NotFound("Application path not found.".to_string()))?;

    let profile_dir = root.join("profiles").join(&profile);

    let content_dir = match content_type {
        ContentType::Resourcepack => profile_dir.join("resourcepacks"),
        ContentType::Shader => profile_dir.join("shaderpacks"),
        ContentType::Mod => profile_dir.join("mods"),
        ContentType::Modpack => {
            return Err(Error::Generic(
                "Modpack content is not supported".to_string(),
            ))
        }
    };

    let filename_temp = src.clone();
    let filename = filename_temp
        .file_name()
        .ok_or_else(|| Error::Generic("Failed to get filename".to_string()))?
        .to_string_lossy()
        .to_string();

    let output_filepath = content_dir.join(&filename);
    if output_filepath.exists() {
        return Err(Error::Generic("File already exists.".to_string()));
    }

    // copy to dir
    tokio::fs::copy(src, &output_filepath).await?;
    // gen hash
    let hash = get_file_hash(&output_filepath).await?;
    let content_name = content_type.as_string();

    let wdb = db.write().await;
    // add to content list
    sqlx::query!(
        "INSERT INTO profile_content (id,sha1,profile,file_name,type) VALUES (?,?,?,?,?)",
        "",
        hash,
        profile,
        filename,
        content_name
    )
    .execute(&wdb.0)
    .await?;

    Ok(())
}
