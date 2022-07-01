use crate::expections::{ LauncherLibError, LibResult };
use crate::json::{
    install::{
        VersionManifest,
        Rule,
        DownloadState,
        Event
    },
    game_settings::GameOptions
};
use tokio::io::{ copy };
use tokio::fs::{ read_to_string, create_dir_all, read, remove_file, File };
use std::io::{ Cursor };
use std::env::{ consts, var };
use std::path::PathBuf;
use crypto::{ sha1::Sha1, digest::Digest };
use log::{ error };

pub async fn read_manifest(path: PathBuf) -> LibResult<VersionManifest> {
    match read_to_string(path).await {
        Ok(raw) => {
            match serde_json::from_str::<VersionManifest>(&raw) {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::ParseJsonSerde(err))
            }
        },
        Err(err) => Err(LauncherLibError::OS{
            source: err,
            msg: "Failed to read version manifest".into()
        })
    }
}

/// creates the http client with the set user_agent
pub async fn get_http_client() -> LibResult<reqwest::Client> {
    let client = reqwest::ClientBuilder::new();
    match client.user_agent(format!("rustymodclient/{}",env!("CARGO_PKG_VERSION"))).build() {
        Ok(value) => Ok(value),
        Err(err) => Err(LauncherLibError::HTTP {
            msg: "Failed to create http client".into(),
            source: err
        })
    }
}

/// Returns the default path to the .minecraft directory
pub fn get_minecraft_directory() -> LibResult<PathBuf> {
    match consts::OS {
        "windows" => {
            match var("APPDATA") {
                Ok(appdata) => {
                   Ok(PathBuf::from(&appdata).join(".minecraft"))
                }
                Err(err) => Err(LauncherLibError::ENV {
                    source: err,
                    msg: "Failed to read APPDATA env variable".into()
                })
            }
        }
        _ => Err(LauncherLibError::Unsupported("This operating system is unsupported".into()))
    }
}

pub async fn get_local_installed_versions(mc_dir: PathBuf) -> LibResult<Vec<VersionManifest>> {

    let versions = mc_dir.join("versions");

    match versions.read_dir() {
        Ok(dir_contents) => {
            let mut versions = vec![];
            for folder in dir_contents {
                match folder {
                    Ok(value) => {
                        if let Some(json_file) = value.path().components().last() {
                            let base = json_file.as_os_str().to_str().unwrap();
                            let path = value.path().join(format!("{}.json",base));
                            if !path.is_file() { continue; }
                            match read_to_string(path).await {
                                Ok(raw_json) => {
                                    match serde_json::from_str::<VersionManifest>(&raw_json) {
                                        Ok(json) => {
                                            versions.push(json);
                                        }
                                        Err(err) => {
                                            let result = LauncherLibError::ParseJsonSerde(err);
                                            error!("{}",result);
                                        }
                                    }
                                }
                                Err(err) => {
                                    let os_err = LauncherLibError::OS {
                                        source: err,
                                        msg: "Failed to read file to string".into()
                                    };
                                    error!("{}",os_err);
                                }
                            }
                        }
                    }
                    Err(err) => {
                        let os_err = LauncherLibError::OS {
                            source: err,
                            msg: "Failed to read directory".into()
                        };
                        error!("{}",os_err);
                    }
                }
            }
            Ok(versions)
        }
        Err(err) => Err(LauncherLibError::OS {
            source: err,
            msg: "Failed to read directory".into()
        })
    }
}

/// Tries the find out the path to the default java executable
pub fn get_java_executable() -> LibResult<PathBuf> {
    if let Ok(java) = var("JAVA_HOME") {
        let end = match consts::OS {
            "windows" => "exe",
            _ => ""
        };
        return Ok(PathBuf::from(&java).join("bin").join(end));
    }
    
    match consts::OS {
        "windows" => {
            let oracle_exe = PathBuf::from("C:\\Program Files (x86)\\Common Files\\Oracle\\Java\\javapath\\java.exe");
            let jdk_path = PathBuf::from("C:\\Program Files\\AdoptOpenJDK\\");

            if oracle_exe.is_file() {
                return Ok(oracle_exe);
            }

            if jdk_path.is_dir() {
                if let Ok(dir) = jdk_path.read_dir() {
                    if let Some(folder) = dir.last() {
                        let java = folder.unwrap().path().join("bin\\java.exe");
                        if java.is_file() {
                            return Ok(java.to_path_buf())
                        }
                    }
                }
            }

            Err(LauncherLibError::NotFound("Failed to find java executable".into()))
        }
        _ => Err(LauncherLibError::Unsupported(format!("{} is currently unsupported",consts::OS)))
    }
}

/// Returns the classpath seperator for the current os
pub fn get_classpath_separator() -> String {
    match consts::OS {
        "windows" => String::from(";"),
        _ => String::from(":")
    }
}

pub fn get_os_version() -> String {
    if let Ok(version) = os_version::detect() {
        match version {
            os_version::OsVersion::Windows(value) => {
                return format!("{}.",value.version).to_string()
            } 
            os_version::OsVersion::Linux(value) => {
                if let Some(version) = value.version {
                    return version
                }
            }
            _ => return String::default()
        }
    } 
    String::default()
}

/// generates the sha1 hash for a file
pub async fn get_sha1(path: PathBuf) -> LibResult<String> {
    let mut hasher = Sha1::new();
    match read(path).await {
        Ok(raw) => {
            hasher.input(&raw);
            Ok(hasher.result_str())
        }
        Err(err)=> Err(LauncherLibError::OS{
            source: err,
            msg: "SHA1 | Failed to read file".into()
        })
    }
}

pub async fn download_file(url: String, output: PathBuf, callback: impl Fn(Event), sha1: Option<String>, compressed: bool) -> LibResult<DownloadState> {
    // check if the file directory exits
    if !output.exists() {
        let mut path = output.clone();
        path.pop();
        if !path.exists() {
            if let Err(err) = create_dir_all(path).await {
               return Err(LauncherLibError::OS {
                   source: err,
                   msg: "Failed to create directory".into()
               });
            }
        }
    }

    // if exits/has sha1 check if vaild if not remove invaild file.
    if output.exists() && output.is_file() {
        if sha1.is_none() {
            callback(Event::download(DownloadState::ExistsUnchecked, url.clone()));
            return Ok(DownloadState::ExistsUnchecked);
        }

        if let Err(error) = remove_file(output.clone()).await {
            return Err(LauncherLibError::OS {
                msg: "Failed to remove file".into(),
                source: error
            });
        }  
        
    }

    if !url.starts_with("http") {
        callback(Event::Error("Url is invaild".into()));
        return Err(LauncherLibError::General("DOWNLOAD FILE | Invaild url".into()));
    }

    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(&url).send().await {
        Ok(response) => {
            match response.bytes().await {
                Ok(value) => {
                    let mut file = match File::create(output.clone()).await {
                        Ok(value) => value,
                        Err(error) => return Err(LauncherLibError::OS{
                                source: error,
                                msg: "Failed to create file".into()
                        })
                    };
                    if compressed {
                        let mut buf = Cursor::new(value);

                        let mut sync_file: std::fs::File = file.into_std().await;

                        if let Err(error) = lzma_rs::lzma_decompress(&mut buf, &mut sync_file) {
                            callback(Event::Error("Failed to decompress file".into()));
                            return Err(LauncherLibError::General(error.to_string()));
                        }
                    } else {

                        let mut content = Cursor::new(value);
                        if let Err(err) = copy(&mut content, &mut file).await {
                            return Err(LauncherLibError::OS{
                                source: err,
                                msg: "Failed to copy contents to file".into()
                            });
                        }
                    }

                    if let Some(sha) = sha1 {
                        match get_sha1(output.clone()).await {
                            Ok(value) => {
                                if sha == value {
                                    callback(Event::download(DownloadState::DownloadChecked, url.clone()));
                                    return Ok(DownloadState::DownloadChecked);
                                }
                                callback(Event::Error(format!("Sha1 Failed | {}",url.clone())));
                            }
                            Err(error) => {
                                callback(Event::Error(error.to_string()));
                                return Err(error);
                            }
                        }
                    } 
                    callback(Event::download(DownloadState::Download, url.clone()));
                    Ok(DownloadState::Download)
                }
                Err(err) => {
                    Err(LauncherLibError::HTTP {
                        msg: format!("Failed to download file | {}",url.clone()).into(),
                        source: err
                    })
                }
            }
        }
        Err(err) => Err(LauncherLibError::HTTP { source: err, msg: "Failed to make http request".into() })
    }
}

/// Parse a single rule from versions.json in .minecraft
pub fn parse_single_rule(rule: &Rule, options: &GameOptions) -> bool {
 
    let result = match rule.action.as_str() {
        "disallow" => true,
        _ => false
    };

    if let Some(os) = &rule.os {
        for (key, value) in os.iter() {
            match key.as_str() {
                "name" => {
                    if value.as_str() == "windows" && consts::OS != "windows" {
                        return result;
                    } else if value.as_str() == "osx" && consts::OS != "macos" {
                        return result;
                    } else if value.as_str() == "linux" && consts::OS != "linux" {
                        return result;
                    }
                }
                "arch" => {
                    if value == "x86" && consts::ARCH != "x86" {
                        return result;
                    }
                }
                "version" => {
                    let r = regex::Regex::new(value.as_str()).expect("Failed to create regex");
                    if !r.is_match(get_os_version().as_str()) {
                        return result;
                    }
                }
                _ => {}
            }
        }
    }


    if let Some(features) = &rule.features {
        for (key,_) in features.iter() {
            if key == "has_custom_resolution" && !options.custom_resolution.is_some() {
                return result;
            }
            if key == "is_demo_user" && !options.demo {
                return result;
            }
        }
    }

    !result
}

// Parse rule list
pub fn parse_rule_list(data: &Vec<Rule>, options: &GameOptions) -> bool {
    for i in data.iter() {
        if !parse_single_rule(i, options) {
            return false;
        }
    }
    true
}


/// Implement the inheritsFrom function
/// See <https://github.com/tomsik68/mclauncher-api/wiki/Version-Inheritance-&-Forge>
/// This function my be unneed
pub async fn inherit_json(original_data: &VersionManifest, path: &PathBuf) -> LibResult<VersionManifest> {
    let inherit_version = if let Some(value) = original_data.inherits_from.clone() { value } else {
        return Err(LauncherLibError::General("Expected inheritesFrom to be set".into()));
    };
    
    let mut new_data = VersionManifest {
        _comment_: None,
        inherits_from: None,
        time: original_data.time.clone(),
        release_time: original_data.release_time.clone(),
        id: original_data.id.clone(),
        release_type: original_data.release_type.clone(),
        main_class: original_data.main_class.clone(),
        arguments: original_data.arguments.clone(),
        libraries: original_data.libraries.clone(),
        jar: original_data.jar.clone(),
        asset_index: None,
        assets: None,
        java_version: None,
        downloads: None,
        compliance_level: None,
        logging: None,
        minimum_launcher_version: None,
    };

    let version_path = path.join("versions").join(inherit_version.clone()).join(format!("{}.json",inherit_version));
    let inherit_data: VersionManifest = match read_manifest(version_path).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    new_data.asset_index = inherit_data.asset_index;
    new_data.assets = inherit_data.assets;
    new_data.java_version = inherit_data.java_version;
    new_data.downloads = inherit_data.downloads;
    new_data.compliance_level = inherit_data.compliance_level;
    new_data.logging = inherit_data.logging;
    new_data.minimum_launcher_version = inherit_data.minimum_launcher_version;

    for lib in inherit_data.libraries.iter() {
        new_data.libraries.push(lib.to_owned());
    }

    for arg in inherit_data.arguments.game {
        new_data.arguments.game.push(arg.to_owned());
    }  

    for arg in inherit_data.arguments.jvm {
        new_data.arguments.jvm.push(arg.to_owned());
    }

    Ok(new_data)
}


pub async fn read_manifest_inherit(version_json: PathBuf, mc_dir: &PathBuf) -> LibResult<VersionManifest>  {
    match read_manifest(version_json).await {
        Ok(value) => {
            if value.inherits_from.is_some() {
                match inherit_json(&value, &mc_dir).await {
                    Ok(inherited) => Ok(inherited),
                    Err(err) => return Err(err)
                }
            } else {
                Ok(value)
            }
        },
        Err(err) => return Err(err)
    }
}


#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_download_file(){
        let out = PathBuf::from("C:\\projects\\mc-installer-v2\\src-tauri\\mc-laucher-lib-rs\\tests");
        let file_compressed: String = "https://launcher.mojang.com/v1/objects/962508e35b9c56e3c89ea4620672cecbeba47109/java".into();
        let url_uncomcompressed: String = "https://launcher.mojang.com/v1/objects/1654ec74efdc41582e5f954c10681cbde5a22996/java".into();
        let sha1_compressed: String = "962508e35b9c56e3c89ea4620672cecbeba47109".into();
        let sha1_uncompressed: String = "1654ec74efdc41582e5f954c10681cbde5a22996".into();

        // compressed
        match download_file(file_compressed.clone(), out.join("java_c.exe"), |event| { println!("Compressed: {:#?}",event); }, None, true).await {
            Ok(value) => {
                println!("{:#?}",value);
            }
            Err(err) => {
                eprintln!("{:#?}",err);
            }
        }

        // compressed with sha1
        match download_file(file_compressed, out.join("java_cs.exe"), |event| { println!("Compressed: {:#?}",event); }, Some(sha1_compressed), true).await {
            Ok(value) => {
                println!("{:#?}",value);
            }
            Err(err) => {
                eprintln!("{:#?}",err);
            }
        }

        // no compress
        match download_file(url_uncomcompressed.clone(), out.join("java_u.exe"), |event| { println!("Compressed {:#?}",event); }, None, false).await {
            Ok(value) => {
                println!("{:#?}",value);
            }
            Err(err) => {
                eprintln!("{:#?}",err);
            }
        }

         // no compress with sha1
         match download_file( url_uncomcompressed, out.join("java_us.exe"), |event| { println!("SHA1 {:#?}",event); },Some(sha1_uncompressed), false).await {
            Ok(value) => {
                println!("{:#?}",value);
            }
            Err(err) => {
                eprintln!("{:#?}",err);
            }
        }
    }


    #[test]
    fn test_get_java_executable() {
        match get_java_executable() {
            Ok(value) => {
                println!("{:#?}",value);
            }
            Err(err) => {
                eprintln!("{}",err);
            }
        }
    }
    #[tokio::test]
    async fn test_get_local_installed_versions() {
        let path = get_minecraft_directory().unwrap();
            match get_local_installed_versions(path).await {
                Ok(value) => {
                    println!("{:#?}",value[0]);
                }
                Err(err) => {
                    eprintln!("{}",err);
                }
            }
    }
    #[test]
    fn test_get_minecraft_directory() {
            match get_minecraft_directory() {
                Ok(value) => {
                    println!("{:#?}",value);
                }
                Err(err) => {
                    eprintln!("{}",err);
                }
            }
    }
}
