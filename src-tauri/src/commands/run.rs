use mc_laucher_lib_rs::client::ClientBuilder;
use mc_laucher_lib_rs::json::authentication_microsoft::Account;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RunMinecraft {
    version: String,
    profile: Account
}

#[derive(Default)]
pub struct GameState {

}

#[tauri::command]
pub async fn run_minecraft(_state: tauri::State<'_,GameState>, params: RunMinecraft) -> Result<(), String> {

    let mut client = match ClientBuilder::new(None) {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };

    if let Err(err) = client.set_minecraft(params.version, None,None) {
        return Err(err.to_string());
    }
    client.as_msa_user(params.profile);
    client.set_client_id("Minecraft".to_string());
    //client.enable_debug();
    client.set_jvm_args("-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M".to_string());

  
   /*match state.is_running() {
        Ok(value) => {
            if value {
                return Err("A instance of minecraft is already running".to_string());
            }
        }
        Err(err) => return Err(err.to_string())
    }*/

    let mut runtime = match client.build() {
        Ok(value) => value,
        Err(err) => return Err(err.to_string())
    };


    if let Err(err) = runtime.start().await {
        return Err(err.to_string());
    }
    
    // https://users.rust-lang.org/t/should-i-unwrap-a-mutex-lock/61519
   // *state.minecraft.lock().unwrap() = runtime;

    Ok(())
}