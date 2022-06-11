use crate::expections::{LauncherLibError, LibResult };
use crate::json::{
    install::{
        ExtractFile,
        Library
    }
};
use std::env::consts;
use std::fs::{ File, create_dir_all };
use std::path::PathBuf;
use log::{ error };

pub fn get_natives(library: &Library) -> String {
    let arch = match consts::ARCH {
        "x86" => "32",  
        _ => "64"
    };

    if let Some(native) = &library.natives {
        let os = match consts::OS {
            "macos" => "osx",
            _ => consts::OS
        };

        if let Some(value) = native.get(os) {
            return value.clone().replace("{$arch}",arch);
        }
    }

    String::default()
}

pub fn extract_native_file(zip_file: &PathBuf,  extract_path: &PathBuf) -> LibResult<()> {

    if let Err(error) = create_dir_all(extract_path.clone()) {
        return Err(LauncherLibError::OS {
            msg: "Failed to create directory".into(),
            source: error
        });
    }

    let file = match File::open(zip_file) {
        Err(error) => return Err(LauncherLibError::OS{
            source: error,
            msg: format!("Failed to open {}",zip_file.display())
        }),
        Ok(value) => value
    };

    let mut zip: zip::ZipArchive<File> = match zip::ZipArchive::new(file) {
        Ok(value) => value,
        Err(error) => return Err(LauncherLibError::ZipError(error))
    };

    for i in 0..zip.len() {
       match zip.by_index(i) {
        Ok(mut item) => {
            if item.is_dir() { continue; }
            let name = PathBuf::from(item.name());

            let ext = name.extension(); 

            if ext.is_none() { continue; }

            if ext.expect("Expected value to be some") != consts::DLL_EXTENSION { continue; }

            if let Some(file_name) = name.file_name() {
                let mut native_file = match File::create(extract_path.join(file_name)) {
                    Ok(value) => value,
                    Err(err) => return Err(LauncherLibError::OS { msg: "Failed to create native file".into(), source: err })
                };

                if let Err(err) = std::io::copy(&mut item, &mut native_file) {
                    return Err(LauncherLibError::OS { msg: "Failed to write buffer to native file".into(), source: err })
                }
            }
        }
        Err(err) => {
            error!("{}",err);
        }
       }
    }


    Ok(())
}

pub fn extract_natives_file(archive: PathBuf, extract_path: &PathBuf, extract_data: &ExtractFile) -> LibResult<()> {

    if let Err(error) = create_dir_all(extract_path.clone()) {
        return Err(LauncherLibError::OS {
            msg: "Failed to create directory".into(),
            source: error
        });
    }

    let file = match File::open(archive.clone()) {
        Err(error) => return Err(LauncherLibError::OS{
            source: error,
            msg: format!("Failed to open file | {}",archive.display())
        }),
        Ok(value) => value
    };

    let mut zip: zip::ZipArchive<File> = match zip::ZipArchive::new(file) {
        Ok(value) => value,
        Err(error) => return Err(LauncherLibError::ZipError(error))
    };

    for i in 0..zip.len() {
        match zip.by_index(i) {
            Ok(mut item) => {
               let mut skip = false;
               for e in &extract_data.exclude  {
                   if item.name().starts_with(e) {
                       skip = true;
                       break;
                   }
               }
               if skip { continue; }

               let mut handle = match  File::create(extract_path.join(item.name())) {
                    Ok(value) => value,
                    Err(err) => return Err(LauncherLibError::OS {
                        msg: "Failed to write file".into(),
                        source: err
                    })
                };

                if let Err(err) = std::io::copy(&mut item, &mut handle) {
                    return Err(LauncherLibError::OS { msg: "Failed to write buffer to file".into(), source: err })
                }
            }
            Err(err) => error!("{}",LauncherLibError::ZipError(err))
        }
    }
    Ok(())
}


// Extract natives into the givrn path.
/*pub fn extract_natives(version_id: String, path: PathBuf, extract_path: PathBuf) -> LibResult<()> {

    let file = path.join("versions").join(version_id.clone()).join(format!("{}.json",version_id));

    if !file.is_file() {
        return Err(LauncherLibError::NotFound(version_id));
    }

    let manifest: VersionManifest = match read_to_string(file) {
        Ok(raw) => {
            match serde_json::from_str::<VersionManifest>(&raw) {
                Ok(value) => value,
                Err(err) => return Err(LauncherLibError::ParseJsonSerde(err))
            }
        }
        Err(err) => return Err(LauncherLibError::OS {
            source: err,
            msg: "Failed to read file".into()
        })
    };

    for i in manifest.libraries {

        if let Some(rules) = &i.rules {
            if !parse_rule_list(&rules, &mut GameOptions::default()) {
                continue;
            }
        }

       let mut current_path = path.join("libraries");

       let (lib_path,name,version) = match get_library_data(i.name.clone()) {
           Ok(value) => value,
           Err(err) => return Err(err)
       };


       for lib_part in lib_path.split(".").collect::<Vec<&str>>() {
            current_path = current_path.join(lib_part);
       }

       current_path = current_path.join(name.clone()).join(version.clone());

       let native = get_natives(&i);

       if native.is_empty() {
           continue;
       }

       let jar_filename_native = format!("{}-{}-{}.jar",name,version,native);

       if let Some(extract) = &i.extract {
            if let Err(err) = extract_natives_file(current_path.join(jar_filename_native),&extract_path,extract) {
                return Err(err);
            }
       }
    }

    Ok(())
}*/

#[cfg(test)]
mod tests {
    use super::*;

    fn init_logger(){
        let _ = env_logger::builder().filter_level(log::LevelFilter::Info).is_test(true).try_init();
     }

    #[test]
    fn test_extract_native(){
        init_logger();

        let path = PathBuf::from("C:/Users/Collin/AppData/Roaming/.minecraft/libraries/org/lwjgl/lwjgl-jemalloc/3.3.1/lwjgl-jemalloc-3.3.1-natives-windows.jar");
        let out = PathBuf::from("C:/Users/Collin/AppData/Roaming/.minecraft/versions/1.19/natives");

        match extract_native_file(&path, &out) {
            Ok(_value) => {}
            Err(err) => {
                eprintln!("{}",err);
            }
        }
    }
}