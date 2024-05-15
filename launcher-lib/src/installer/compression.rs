use async_zip::base::read::seek::ZipFileReader;
use futures::AsyncReadExt;
use log::info;
use normalize_path::NormalizePath;
use serde::de::DeserializeOwned;
use std::path::{Path, PathBuf};
use tokio::{
    fs::{self, File, OpenOptions},
    io::BufReader,
};
use tokio_util::compat::{Compat, TokioAsyncReadCompatExt, TokioAsyncWriteCompatExt};

use crate::errors::LauncherError;

type Archive = ZipFileReader<Compat<BufReader<File>>>;

pub async fn get_mainclass(file: &Path) -> Result<String, LauncherError> {
    let mut archive = open_archive(File::open(file).await?).await?;

    let file_index = archive
        .file()
        .entries()
        .iter()
        .position(|item| {
            item.filename()
                .as_str()
                .is_ok_and(|x| x.ends_with("MANIFEST.MF"))
        })
        .ok_or(LauncherError::NotFound(
            "Failed to get index of file".to_string(),
        ))?;

    let mut entry_reader = archive.reader_without_entry(file_index).await?;

    let mut buffer = String::new();
    let bytes = entry_reader.read_to_string(&mut buffer).await?;
    info!("Read {} bytes from archive", bytes);

    let (_, main_class) = lazy_regex::regex_captures!(r"Main-Class: (?<main_class>.+)", &buffer)
        .ok_or(LauncherError::NotFound(
            "Failed to get main class".to_string(),
        ))?;

    Ok(main_class.trim().to_owned())
}

/// open archive
pub async fn open_archive(file: File) -> Result<Archive, LauncherError> {
    let archive = tokio::io::BufReader::new(file).compat();
    ZipFileReader::new(archive)
        .await
        .map_err(LauncherError::from)
}

/// extract a file from archive and parse into given value.
pub async fn parse_extract<T>(
    reader: &mut ZipFileReader<Compat<BufReader<File>>>,
    filename: &str,
) -> Result<T, LauncherError>
where
    T: DeserializeOwned,
{
    let file_index = reader
        .file()
        .entries()
        .iter()
        .position(|item| item.filename().as_str().is_ok_and(|x| x == filename))
        .ok_or(LauncherError::NotFound(
            "Failed to get index of file".to_string(),
        ))?;

    let mut entry_reader = reader.reader_without_entry(file_index).await?;

    let mut buffer = Vec::new();
    let bytes = entry_reader.read_to_end(&mut buffer).await?;

    info!("Read {} bytes from archive", bytes);

    serde_json::from_slice::<T>(&buffer).map_err(LauncherError::from)
}

/// extract a file from archive
pub async fn extract_file_to(
    archive: &mut Archive,
    filename: &str,
    outdir: &Path,
) -> Result<u64, LauncherError> {
    let file_index = archive
        .file()
        .entries()
        .iter()
        .position(|item| item.filename().as_str().is_ok_and(|x| x == filename))
        .ok_or(LauncherError::NotFound(
            "Failed to get index of file".to_string(),
        ))?;

    extract_file_at(archive, file_index, outdir).await
}

pub async fn extract_dir(
    archive: &mut Archive,
    dir: &str,
    outdir: &Path,
) -> Result<(), LauncherError> {
    for index in 0..archive.file().entries().len() {
        let entry = archive
            .file()
            .entries()
            .get(index)
            .ok_or(LauncherError::Generic("Failed to get entry".to_string()))?;

        let file_name = entry.filename().as_str()?;
        if file_name.starts_with(dir) {
            info!("Extracting file {}", file_name);
            extract_file_at(archive, index, outdir).await?;
        }
    }

    Ok(())
}

/// Extract all files from archive
pub async fn extract_all(archive: &mut Archive, outdir: &Path) -> Result<(), LauncherError> {
    for index in 0..archive.file().entries().len() {
        extract_file_at(archive, index, outdir).await?;
    }

    Ok(())
}

async fn extract_file_at(
    archive: &mut Archive,
    index: usize,
    outdir: &Path,
) -> Result<u64, LauncherError> {
    let entry = archive
        .file()
        .entries()
        .get(index)
        .ok_or(LauncherError::Generic("Failed to get entry".to_string()))?;

    let file_path = outdir
        .join(sanitize_file_path(entry.filename().as_str()?))
        .normalize();

    info!("Extracting file to {}", file_path.to_string_lossy());

    if entry.dir()? {
        if !file_path.exists() {
            fs::create_dir_all(&file_path).await?;
        }

        Ok(0)
    } else {
        if file_path.exists() && file_path.is_file() {
            return Ok(0);
        }

        if let Some(parent) = file_path.parent() {
            if !parent.exists() {
                fs::create_dir_all(&parent).await?;
            }
        }

        let mut entry_reader = archive.reader_without_entry(index).await?;
        let writer = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file_path)
            .await?;

        let bytes = futures::io::copy(&mut entry_reader, &mut writer.compat_write()).await?;
        info!("Extracted {} bytes from archive", bytes);

        Ok(bytes)
    }
}

fn sanitize_file_path(path: &str) -> PathBuf {
    // Replaces backwards slashes
    path.replace('\\', "/")
        // Sanitizes each component
        .split('/')
        .map(sanitize_filename::sanitize)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::env::temp_dir;

    use tokio::fs::File;

    #[tokio::test]
    async fn test_get_mainclass() {
        let file = temp_dir().join("forge-1.20.6-50.0.20-installer.jar");

        let main_class = get_mainclass(&file).await.expect("Failed to get mainclass");

        assert_eq!(main_class, "net.minecraftforge.installer.SimpleInstaller");
    }

    #[tokio::test]
    async fn test_extract_dir() {
        let file = temp_dir();
        let mut archive = open_archive(
            File::open(&file.join("forge-1.20.6-50.0.20-installer.jar"))
                .await
                .expect("Failed to open file."),
        )
        .await
        .expect("Failed to open archive");

        extract_dir(&mut archive, "maven", &file.join("libraries"))
            .await
            .expect("Failed to extract");
    }
}
