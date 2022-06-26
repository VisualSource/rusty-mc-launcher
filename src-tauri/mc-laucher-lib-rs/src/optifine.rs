use crate::utils::{ get_http_client, download_file };
use crate::expections::{ LauncherLibError,LibResult };
use crate::runtime::get_exectable_path;
use crate::install::install_minecraft_version;
use crate::runtime::{ install_jvm_runtime, does_runtime_exist };
use crate::json::{
    runtime::MinecraftJavaRuntime,
    install::{
        Event
    }
};
use scraper::{Html, Selector};
use tokio::process::Command;
use tokio::fs::remove_file;
use std::process::{ Stdio };
use std::path::PathBuf;
use log::{info};

const OPTIFINE_HEADLESS: &str = "https://github.com/VisualSource/rusty-mc-launcher/raw/master/wellknowns/jars/optifineheadless.jar";
//const OPTIFINE_HEADLESS_SHA1: &str = "";
const OPTIFINE_DOWNLOADS_PAGE: &str = "https://optifine.net/downloads";

#[derive(Debug, Default, Clone)]
pub struct OptifineVersion {
    pub name: String,
    pub url: String,
    pub mc: String
}

pub async fn get_optifine_versions() -> LibResult<Vec<OptifineVersion>> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(OPTIFINE_DOWNLOADS_PAGE).send().await {
        Ok(value) => {
            match value.text().await {
                Ok(html) => {   
                    let document = Html::parse_document(&html);
                    let selector = Selector::parse("tr.downloadLine.downloadLineMain").expect("Failed to parse html query");
                    let slector_name = Selector::parse("td.colFile").expect("Failed to make selector");
                    let slector_url = Selector::parse("td.colMirror > a").expect("Failed to make selector");

                    let mut versions: Vec<OptifineVersion> = vec![];

                    for element in document.select(&selector) {
                        if let Some(name_raw) = element.select(&slector_name).collect::<Vec<scraper::element_ref::ElementRef>>().get(0) {
                            let mut version = OptifineVersion::default();
                            if let Some(name) = name_raw.text().collect::<Vec<&str>>().get(0) {
                                version.name = name.to_string().replace("OptiFine ","").replace(" ", "_");
                            } 
                            if let Some(url_raw) = element.select(&slector_url).collect::<Vec<scraper::element_ref::ElementRef>>().get(0) {
                                if let Some(url) = url_raw.value().attr("href") {
                                    version.url = url.to_string();
                                }
                            }

                            if let Some(mc_raw) = version.url.split("=").collect::<Vec<&str>>().get(1) {
                                if let Some(mc) = mc_raw.replace("OptiFine_","").replace("_"," ").split(" ").collect::<Vec<&str>>().get(0) {
                                    version.mc = mc.to_string();
                                }
                            }

                            versions.push(version);
                        }
                    }

                    Ok(versions)
                }
                Err(err) => Err(LauncherLibError::General(err.to_string()))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP { 
            source: err,
            msg: "Failed to make request".into()
        })
    }
}

pub async fn get_optifine_download(url: String) -> LibResult<String> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };
    match client.get(url).send().await {
        Ok(value) => {
            match value.text().await {
                Ok(html) => {
                    let document = Html::parse_document(&html);

                    let selector = Selector::parse("span#Download > a").expect("Failed to parse html query");

                    let content = document.select(&selector).collect::<Vec<scraper::ElementRef>>();

                    if let Some(link) = content.get(0) {
                       if let Some(a) = link.value().attr("href") {
                           return Ok(format!("https://optifine.net/{}",a.to_string()).into());
                       }
                    }

                    Err(LauncherLibError::General("Failed to get optifine download url".into()))
                }
                Err(err) => Err(LauncherLibError::General(err.to_string()))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP{
            source: err,
            msg: "Failed to get file jar".into()
        })
    }
}

pub async fn install_optifine(mc: String, mc_dir: PathBuf, temp_path: PathBuf, callback: &impl Fn(Event), cache_path: Option<PathBuf>, loader: Option<String>, java: Option<PathBuf>, cache_headless: bool, cache_installer: bool) -> LibResult<()> {
    
    let runtime = MinecraftJavaRuntime::use_latest();
    match does_runtime_exist(runtime.clone(), mc_dir.clone()) {
        Ok(value) => {
            if !value {
                if let Err(err) = install_jvm_runtime(runtime, mc_dir.clone(), callback).await {
                    return Err(err);
                }
            }
        }
        Err(err) => return Err(err)
    }
    
    let versions: Vec<OptifineVersion> = match get_optifine_versions().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let version: OptifineVersion = match loader {
        Some(value) => {
            let mut data = OptifineVersion::default();
            for i in &versions {
                if i.mc == mc && i.name == value {
                    data = i.clone();
                }
            }
            if data.name.is_empty() {
                return Err(LauncherLibError::NotFound(value));
            }
            data
        },
        None => {
            let mut data = OptifineVersion::default();

            for i in &versions {
                if i.mc == mc {
                    data = i.clone();
                }
            }

            if data.name.is_empty() {
                return Err(LauncherLibError::NotFound(mc));
            }

            data
        }
    };
 
    let headless_path = if cache_headless {
        match &cache_path {
            Some(value) => value.join("optifineheadless.jar"),
            None => temp_path.join("optifineheadless.jar")
        }
    } else {
        temp_path.join("optifineheadless.jar")
    };

    let optifine_id = format!("{}-OptiFine_{}",version.mc.clone(),version.name).to_string();
    let installer_jar = format!("{}.jar",optifine_id);
    let installer_path = if cache_installer {
        match &cache_path {
            Some(value) => value.join(installer_jar.clone()),
            None => temp_path.join(installer_jar.clone())
        }
    } else {
        temp_path.join(installer_jar.clone())
    };

    callback(Event::Status("Checking for vanilla minecraft".into()));
    if !mc_dir.join("versions").join(mc.clone()).join(format!("{}.json",mc.clone())).is_file() {
        if let Err(err) = install_minecraft_version(mc.clone(),mc_dir.clone(),callback).await {
            return Err(err);
        }
    }

    callback(Event::Status("Downloading OptiFine Headless".into()));
    callback(Event::progress(0, 2));
    if let Err(err) = download_file(OPTIFINE_HEADLESS.into(), headless_path.clone(), callback, None, false).await {
        return Err(err);
    }   
    callback(Event::progress(1, 2));

    let download_url = match get_optifine_download(version.url.clone()).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    callback(Event::Status("Downloading OptiFine".into()));
    if let Err(err) = download_file(download_url, installer_path.clone(), callback, None, false).await {
        return Err(err);
    }
    callback(Event::progress(2, 2));

    let exec: String = match java {
        Some(value) => value.to_str().expect("Failed to make string").into(),
        None => {
            match get_exectable_path(MinecraftJavaRuntime::use_latest(), mc_dir.clone()) {
                Ok(value) => {
                    match value {
                        Some(j) => j.to_str().expect("Failed to make string").into(),
                        None => "java".into()
                    }
                }
                Err(err) => return Err(err)
            }
        }
    };

    let args = [
        "-jar",
        headless_path.to_str().expect("Failed to make str"),
        installer_path.to_str().expect("Failed to make str"),
        mc_dir.to_str().expect("Failed to convert to str")
    ];

    match Command::new(exec).args(args).stdout(Stdio::inherit()).output().await {
        Ok(output) => {
            info!("Stderr: {}",String::from_utf8_lossy(&output.stderr));
            info!("Stdout: {}",String::from_utf8_lossy(&output.stdout));
            info!("Status: {}",output.status);

            callback(Event::Status("Starting cleanup".into()));
            callback(Event::progress(0, 2));
            if !cache_headless {
                if let Err(err) = remove_file(headless_path).await {
                    return Err(LauncherLibError::OS {
                        source: err,
                        msg: "Failed to remove optiFine headless runner".into()
                    });
                }
            }
            callback(Event::progress(1, 2));

            if !cache_installer {
                if let Err(err) = remove_file(installer_path).await {
                    return Err(LauncherLibError::OS {
                        source: err,
                        msg: "Failed to remove optiFine installer jar".into()
                    });
                }
            }
            callback(Event::progress(2, 2));
        }
        Err(err) => return Err(LauncherLibError::OS {
            source: err,
            msg: "Failed to run command".into()
        }) 
    };

    Ok(())
}



#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_get_optifine_download() {
        let download = "http://optifine.net/adloadx?f=OptiFine_1.18.1_HD_U_H4.jar".to_string();
        match get_optifine_download(download).await {
            Ok(value) => println!("{}",value),
            Err(err) => eprintln!("{}",err)
        }
    }

    #[tokio::test]
    async fn test_install_optifine() {
        let mc_dir = PathBuf::from("C:\\Users\\Collin\\AppData\\Roaming\\.minecraft");
        let temp_path = PathBuf::from("C:\\Users\\Collin\\Downloads\\");
        if let Err(err) = install_optifine("1.18.1".into(), mc_dir, temp_path, &|e|{ println!("{:#?}",e) }, None, None, None, false,false).await {
            eprintln!("{}",err);
        }
    }

    #[tokio::test]
    async fn test_get_optifine_versions() {
        match get_optifine_versions().await {
            Ok(value) => println!("{:#?}",value),
            Err(err) => eprintln!("{}",err)
        }
    }
}