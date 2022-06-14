//! Holds the function to generate the default launch command for a give minecraft version manifest file
//! 
use crate::utils::{parse_rule_list,get_classpath_separator, read_manifest_inherit};
use crate::runtime::{get_exectable_path};
use crate::expections::{LauncherLibError,LibResult};
use crate::natives::{get_natives};
use crate::install::{parse_java_dep,parse_java_dep_native};
use crate::json::{
    game_settings::GameOptions,
    install::{ 
        Library,
        VersionManifest,
        Argument
    }
};
use std::path::PathBuf;
use std::env::consts;
use log::{ info };

/// compiles the java libraries into a single string to be used by the launch command
fn get_libraries_string(libs: &Vec<Library>, jar: Option<String>, id: String, path: PathBuf)-> LibResult<String> {
    let seperator = get_classpath_separator();

    let mut libstr = String::default();

    for i in libs {
        if let Some(rules) = &i.rules {
            if !parse_rule_list(&rules, &mut GameOptions::default()) {
                continue;
            }
        }

        let current_path = path.join("libraries");

        let native = get_natives(&i);

        let jar_path = if !native.is_empty() { 
            let (native_path,_) = match parse_java_dep_native(i.name.clone(), None, native) {
                Ok(value) => value,
                Err(err) => return Err(err)
            };
            native_path
        } else { 
            let (path,_) = match parse_java_dep(i.name.clone(), None) {
                Ok(value) => value,
                Err(err) => return Err(err)
            };

            if path.contains("x86") && consts::ARCH != "x86" {
                info!("Ingore x86 lib on {}",consts::ARCH);
                continue;
            }    

            path
        };

        libstr = format!("{}{}{}",libstr,current_path.join(jar_path).to_str().expect("Failed to make path a string"),seperator).to_string();
    }


    // add the minecraft jar to the lib list. add this => .minecraft/versions/1.19/1.19.jar
    if let Some(j) = jar {
        libstr = format!("{}{}",libstr,path.join("versions").join(j.clone()).join(format!("{}.jar",j)).to_str().expect("failed to make string")).to_string();
    } else {
        libstr = format!("{}{}",libstr,path.join("versions").join(id.clone()).join(format!("{}.jar",id)).to_str().expect("failed to make string")).to_string();
    }

    Ok(libstr)
}

/// replaces arguments in the launch command with values. Example player name/id, auth token, etc
fn replace_argument(ogargs: String, manifest: &VersionManifest, path: &PathBuf, options: &GameOptions) -> String {

    let mut argstr = ogargs;

    argstr = argstr.replace("${game_assets}", path.join("assets").join("virtual").join("legacy").to_str().expect("Failed to make string"));
    
    let lib_path = path.join("libraries").to_str().expect("Failed to make str").to_string();
    argstr = argstr.replace("${game_assets}", &lib_path);
    argstr = argstr.replace("${library_directory}", &lib_path);

    argstr = argstr.replace("${game_assets}", &get_classpath_separator());
    
    argstr = argstr.replace("${version_name}", &manifest.id);

    argstr = argstr.replace("${assets_root}", path.join("assets").to_str().expect("Failed to make string"));

    argstr = argstr.replace("${user_type}", &options.user_type.to_string());

    argstr = argstr.replace("${classpath_separator}", &get_classpath_separator());

    argstr = argstr.replace("${user_properties}", "{}");

    if let Some(natives_dir) = options.navtives_directory.clone() {
       argstr = argstr.replace("${natives_directory}", natives_dir.to_str().expect("Failed to make string"));
    }

    if let Some(launcher_name) = options.launcher_name.clone().or(Some("rusty-minecraft-launcher".to_string())) {
        argstr = argstr.replace("${launcher_name}", &launcher_name);
    } 

    if let Some(launcher_version) = options.launcher_version.clone().or(Some(env!("CARGO_PKG_VERSION").to_string())) {
        argstr = argstr.replace("${launcher_version}", &launcher_version);
    } 

    if let Some(classpath) = options.classpath.clone() {
        argstr = argstr.replace("${classpath}", &classpath);
    }

    if let Some(auth_player_name) = options.username.clone() {
        argstr = argstr.replace("${auth_player_name}", &auth_player_name);
    }

    if let Some(release_type) = &manifest.release_type.clone() {
        argstr = argstr.replace("${version_type}", &release_type);
    }

    if let Some(game_directory) = options.game_directory.clone().or(Some(path.clone())) {
        argstr = argstr.replace("${game_directory}", game_directory.to_str().expect("Failed to make string"));
    }

    if let Some(assets_index_name) = &manifest.assets.clone().or(Some(manifest.id.clone())) {
        argstr = argstr.replace("${assets_index_name}", &assets_index_name);
    } 

    if let Some(uuid) = options.uuid.clone().or(Some("{uuid}".to_string())) {
        argstr = argstr.replace("${auth_uuid}", &uuid);
    } 

    if let Some(xuid) = options.xuid.clone().or(Some("{xuid}".to_string())) {
        argstr = argstr.replace("${auth_xuid}", &xuid);
    } 

    if let Some(token) = options.token.clone().or(Some("{token}".to_string())) {
        argstr = argstr.replace("${auth_access_token}", &token);
        argstr = argstr.replace("${auth_session}", &token);
    } 

    if let Some(resolution_width) = options.resolution_width.clone().or(Some("854".to_string())) {
        argstr = argstr.replace("${resolution_width}", &resolution_width);
    }

    if let Some(resolution_height) = options.resolution_height.clone().or(Some("480".to_string())) {
        argstr = argstr.replace("${resolution_height}", &resolution_height);
    } 

    if let Some(client_id) = options.client_id.clone().or(Some("{clientId}".to_string())) {
        argstr = argstr.replace("${clientid}", &client_id);
    }

    argstr
}
/// complies args into a string
fn get_arguments(args: &Vec<Argument>, manifest: &VersionManifest, path: PathBuf, options: &GameOptions) -> Vec<String> {
    let mut args_list: Vec<String> = vec![];

    for i in args {
        match i {
            Argument::Arg(arg) => {
                args_list.push(replace_argument(arg.clone(), &manifest, &path, &options));
            },
            Argument::RuleMulti { rules, value } => {
                if !parse_rule_list(&rules, &options) {
                    continue;
                }
                for a in value {
                    args_list.push(replace_argument(a.clone(), &manifest, &path, &options))
                }
            },
            Argument::RuleSingle{ rules, value } => {
                if !parse_rule_list(&rules, &options) {
                    continue;
                }
                args_list.push(value.clone());
            }
        }
    } 

    args_list
}

/// creates the launch command for minecraft
pub async fn get_launch_command(version: String, mc_dir: PathBuf, options: &mut GameOptions) -> LibResult<(String, Vec<String> )> {
    let version_path = mc_dir.join("versions").join(version.clone()).join(format!("{}.json",version));

    if !version_path.is_file() {
        return Err(LauncherLibError::NotFound(version));
    }

    let manifest: VersionManifest = match read_manifest_inherit(version_path,&mc_dir).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    if options.navtives_directory.is_none() {
        options.navtives_directory = Some(mc_dir.join("versions").join(manifest.id.clone()).join("natives"));
    }


    match get_libraries_string(&manifest.libraries, manifest.jar.clone(), manifest.id.clone(), mc_dir.clone()) {
        Ok(libs) => {
            options.classpath = Some(libs);
        }
        Err(error) => return Err(error)
    }

    let mut command: Vec<String> = vec![];

    if let Some(exec) = &options.executable_path {
        command.push(exec.to_str().expect("Failed to make path string").to_string());
    } else if let Some(java) = &manifest.java_version {
        match get_exectable_path(java.component.clone(), mc_dir.clone()) {
            Ok(exec) => {
                match exec {
                    Some(value) => {
                        command.push(value.to_str().expect("Failed to make path a string").to_string())
                    }
                    None => {
                        command.push("javaw".into())
                    }
                }
            }
            Err(err) => return Err(err)
        }
    } else {
        command.push("javaw".into())
    }

    if let Some(args) = options.jvm_arguments.clone() {
        let mut jvm_args = args.split(" ").map(|e|e.to_string()).collect::<Vec<String>>();
        command.append(&mut jvm_args);
    }

    let mut jvm_args = get_arguments(&manifest.arguments.jvm, &manifest, mc_dir.clone(), &options);
    command.append(&mut jvm_args);
    
    if options.enable_logging_config  {
        if let Some(logger) = &manifest.logging {
            if let Some(client) = logger.get("client") {
                if let Some(id) = &client.file.id {
                    let logger_path = match &options.logging_path {
                        Some(path) => path.clone(),
                        None => mc_dir.join("assets").join("log_configs")
                    };

                    let logger_file = logger_path.join(id);
                    let cmd =  client.argument.replace("${path}",logger_file.to_str().expect("Failed to transform"));
                    command.push(cmd);
                }
            }
        }
    }

    command.push(manifest.main_class.clone());

    let mut launch_args = get_arguments(&manifest.arguments.game, &manifest, mc_dir.clone(), &options);
    command.append(&mut launch_args);

    let exec = command.remove(0);

    Ok((exec, command))
}


