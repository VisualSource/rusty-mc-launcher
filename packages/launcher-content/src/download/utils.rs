use crate::error::{Error, Result};
use launcher_core::sha::{Hashable, Hasher};

use std::{io::Read, path::Path};
use tokio::io::AsyncWriteExt;

lazy_static::lazy_static! {
    pub static ref REQUEST_CLIENT: reqwest::Client = {
        let mut headers = reqwest::header::HeaderMap::new();
        let header = reqwest::header::HeaderValue::from_str(
            &format!("VisualSource/rusty-mc-launcher/{}",env!("CARGO_PKG_VERSION"))
        ).expect("Failed to construct http client user agent");

        headers.insert(reqwest::header::USER_AGENT, header);

        reqwest::Client::builder()
        .tcp_keepalive(Some(std::time::Duration::from_secs(10)))
        .default_headers(headers)
        .build()
        .expect("Request client construct failed.")
    };
}

/// get the hash of the given file using the given hasher
pub fn get_file_hash(file: &Path, mut hasher: impl Hasher) -> Result<String> {
    let mut file = std::fs::File::open(file)?;

    let mut buff = Vec::new();
    file.read_to_end(&mut buff)?;

    hasher.update(&buff);

    Ok(hasher.finish())
}

pub async fn download_file(
    url: &str,
    outdir: &Path,
    hash: Option<impl Hashable>,
    auth: Option<&str>,
) -> Result<()> {
    if let Err(err) = reqwest::Url::parse(url) {
        return Err(Error::FileDownload(err.to_string()));
    }

    if outdir.try_exists()? && outdir.is_file() {
        if let Some(hash) = &hash {
            log::debug!("Checking file on disk against given hash....");
            let hasher = hash.get_hasher();
            let on_disk_file_hash = get_file_hash(outdir, hasher)?;

            if *hash == on_disk_file_hash {
                log::debug!("Hash matches file on disk, aborting download.");
                return Ok(());
            }
        }

        log::warn!(
            "Was unable to verify file intergity (no sha hash was provided), removing and redownloading. File {:?}",
            outdir
        );
        tokio::fs::remove_file(&outdir).await?;
    }

    let mut request = REQUEST_CLIENT.request(reqwest::Method::GET, url);
    if let Some(token) = auth {
        request = request.header(reqwest::header::AUTHORIZATION, token)
    }

    let mut response = request.send().await?;

    if let Err(err) = response.error_for_status_ref() {
        return Err(Error::FileDownload(err.to_string()));
    }

    let mut file = tokio::fs::File::options()
        .write(true)
        .create_new(true)
        .open(&outdir)
        .await?;

    let mut hasher = { hash.as_ref().map(|hashable| hashable.get_hasher()) };

    while let Some(mut chunk) = response.chunk().await? {
        if let Some(hasher) = hasher.as_mut() {
            hasher.update(&chunk);
        }
        file.write_all_buf(&mut chunk).await?;
    }

    file.shutdown().await?;

    if let Some(hasher) = hasher {
        let result = hasher.finish();
        let expected = hash.as_ref().expect("failed to get hash");
        if expected != &result {
            return Err(Error::FileDownload(format!(
                "sha hash failed. Was expecting '{}' but got '{}' for {}",
                expected, result, url
            )));
        }
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    use crate::download::utils::{download_file, get_file_hash};

    fn init_logger() {
        let _ = env_logger::builder()
            .filter_level(log::LevelFilter::max())
            .is_test(true)
            .try_init();
    }

    #[tokio::test]
    async fn test_download_file_has_file_on_disk_sha1() {
        init_logger();

        let filepath = std::env::temp_dir().join("dl_hash_sha1_exists.txt");
        std::fs::write(&filepath, "Im a test file").expect("Failed to write test file");

        let result = download_file(
            "http://localhost:3000/file",
            &filepath,
            Some(launcher_core::sha::Sha1::new(
                "4C77940139AA0786690920B1CED21B41B21EEF73".to_lowercase(),
            )),
            None,
        )
        .await;

        assert!(
            filepath
                .try_exists()
                .expect("failed to test if file exists")
        );
        assert!(result.is_ok());
    }

    // 3ACD198F9FE1B7CFDD22F246A90F93E1B69AE9780F3487C43E099501C533D60D
    // FEB9B408342A758E958171422BBBC0CB9CB30FF3FBBE88A112B5651905F4E90AB58AD23DF86382CC747AABDD766FD972AACC5FE40EED5E37D8BC3CE15C876CBE

    #[tokio::test]
    async fn test_download_file_invalid_url() {
        init_logger();

        let filepath = std::path::Path::new("");

        let result =
            download_file("", filepath, Option::<launcher_core::sha::Sha1>::None, None).await;

        assert!(result.is_err())
    }

    #[tokio::test]
    async fn test_download_file_no_hash() {
        init_logger();

        let url = "http://localhost:3000/file";
        let filepath = std::env::temp_dir().join("test-download-file-none.txt");

        let result = download_file(
            url,
            &filepath,
            Option::<launcher_core::sha::Sha1>::None,
            None,
        )
        .await;

        if let Err(err) = result {
            panic!("{}", err.to_string());
        }

        assert!(result.is_ok());
    }

    #[test]
    fn test_file_hash() {
        let temp = std::env::temp_dir().join("./hash-test.txt");
        std::fs::write(&temp, "Im a test file").expect("Failed to write test file");

        println!("Writing test file to: {:#?}", temp);

        let hasher = launcher_core::sha::Sha1Hasher::default();

        let hash = get_file_hash(&temp, hasher).expect("failed to hash file");

        assert_eq!(
            hash,
            "4C77940139AA0786690920B1CED21B41B21EEF73"
                .to_lowercase()
                .to_string()
        );
    }
}
