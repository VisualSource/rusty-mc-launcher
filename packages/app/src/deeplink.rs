use std::io::{Error, ErrorKind, Result};

use winreg::{
    RegKey,
    enums::{HKEY_CLASSES_ROOT, KEY_WRITE},
};

const REG_KEY_SHELL_OPEN_COMMAND: &str = r#"rmcl\shell\open\command"#;

/**
 * Creates or opens key,
 * returns a boolean if it was created.
 */
fn open_or_create_key(hklm: &RegKey, key: &str) -> Result<(RegKey, bool)> {
    match hklm.open_subkey(key) {
        Ok(reg) => Ok((reg, false)),
        Err(err) => {
            if err.kind() == ErrorKind::PermissionDenied {
                return Err(err);
            }

            let (new_key, _) = hklm.create_subkey(key)?;

            Ok((new_key, true))
        }
    }
}

pub fn ensure_deeplink_windows() -> Result<()> {
    log::info!("[Deeplink] Cheeking....");

    let hklm = RegKey::predef(HKEY_CLASSES_ROOT);

    let (cmd_key, created) = open_or_create_key(&hklm, REG_KEY_SHELL_OPEN_COMMAND)?;
    if !created {
        log::info!("[Deeplink] Found!");
        return Ok(());
    }

    log::warn!("[Deeplink] Deep Link not found. Adding....\n");

    let exe_path = std::env::current_exe()?;
    let exe_path_str = exe_path
        .to_str()
        .ok_or_else(|| Error::new(ErrorKind::Other, "Failed to get exe path"))?;

    // Opening path
    let value = format!("\"{}\" \"%1\"", &exe_path_str);
    cmd_key.set_value("", &value)?;

    let root = hklm.open_subkey_with_flags("rmcl", KEY_WRITE)?;

    root.set_value("", &"URL:us.visualsource.rmcl protocol")?;
    root.set_value("URL Protocol", &"")?;

    let (default_icon, _) = root.create_subkey("DefaultIcon")?;

    let value = format!("\"{}\",0", exe_path_str);
    default_icon.set_value("", &value)?;

    Ok(())
}
