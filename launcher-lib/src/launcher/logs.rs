use std::path::Path;

use serde::Serialize;
use tokio::{
    fs::File,
    io::{AsyncReadExt, AsyncSeekExt},
};

use crate::error::Result;

#[derive(Debug, Serialize)]
pub struct LogCursor {
    pub line: String,
    pub cursor: u64,
}

pub async fn get_latest_log_cursor(log_path: &Path, cursor: u64) -> Result<LogCursor> {
    if !log_path.exists() {
        return Ok(LogCursor {
            line: String::new(),
            cursor: 0,
        });
    }

    let mut file = File::open(log_path).await?;
    let metadata = file.metadata().await?;

    let mut cursor = cursor;
    if cursor > metadata.len() {
        cursor = 0;
    }

    let mut buffer = Vec::new();

    file.seek(std::io::SeekFrom::Start(cursor)).await?;

    let bytes_read = file.read_to_end(&mut buffer).await?;
    let output = String::from_utf8_lossy(&buffer).to_string();

    cursor += bytes_read as u64;

    Ok(LogCursor {
        line: output,
        cursor,
    })
}

#[cfg(test)]
mod tests {
    use std::env::temp_dir;

    use crate::launcher::logs::get_latest_log_cursor;

    #[tokio::test]
    async fn test_get_latest_log_cursor() {
        // SETUP
        let temp = temp_dir();
        let log_file = temp.join("log_test.txt");

        std::fs::write(&log_file, "Test Data\r\n\r\nOther Content")
            .expect("Failed to write test file!");

        //SETUP END

        let result = get_latest_log_cursor(&log_file, 0)
            .await
            .expect("Failed to get path");

        assert_eq!(result.line, "Test Data\r\n\r\nOther Content");
        assert_eq!(result.cursor, 26)
    }
}
