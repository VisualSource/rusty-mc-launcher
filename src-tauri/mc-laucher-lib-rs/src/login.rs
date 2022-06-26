use crate::utils::get_http_client;
use crate::expections::{LauncherLibError,LibResult};
use crate::json::{
    minecraft_account::PlayerProfile,
    authentication_microsoft::{
        AuthoriztionJson, 
        XboxLiveJson,
        MinecraftJson,
        Account
    }
};
use log::debug;
use serde_json::json;
use uuid::Uuid;

const MS_LOGIN: &str = "https://login.live.com/oauth20_authorize.srf"; 
const MS_TOKEN_AUTHORIZATION_URL: &str = "https://login.live.com/oauth20_token.srf";
const MC_PROFILE: &str = "https://api.minecraftservices.com/minecraft/profile";
const MINECRAFT_AUTH_LOGIN: &str = "https://api.minecraftservices.com/authentication/login_with_xbox";
const AUTH_XSTS: &str = "https://xsts.auth.xboxlive.com/xsts/authorize";
const XBOX_LOGIN: &str = "https://user.auth.xboxlive.com/user/authenticate";

/// https://docs.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-auth-code-flow
pub fn ms_login_url(client_id: String, redirect_uri: String) -> String {
    let state = Uuid::new_v4();
    
    format!(
        "{route}?client_id={client_id}&response_type=code&redirect_uri={redirect_uri}&scope=XboxLive.signin%20XboxLive.offline_access&state={state}&prompt=login",
        client_id=client_id,
        redirect_uri=redirect_uri,
        state=state.as_simple().to_string(),
        route=MS_LOGIN  
    ).to_string()
}

///
///https://docs.microsoft.com/en-us/gaming/gdk/_content/gc/live/get-started/live-xbl-overview
/// https://github.com/OpenXbox/xbox-webapi-python/blob/1a5aeb1b1ce94f38b5dae7f6b59938bc9ec112b2/xbox/webapi/api/provider/profile/__init__.py#L53
async fn get_xbox_profile(xsts_token: String, xuid: String) -> LibResult<String> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let body = [
        ( "settings","Gamertag,ModernGamertag,GameDisplayPicRaw,UniqueModernGamertag")
    ];

    match client.get(format!("https://profile.xboxlive.com/users/xuid({})/profile/settings",xuid))
    .query(&body).header("x-xbl-contract-version", "3").bearer_auth(xsts_token).send().await {
        Ok(value) => {
            debug!("{:#?}",value);

            match value.text().await {
                Ok(raw) => {
                    debug!("{}",raw);
                }
                Err(err) => return Err(LauncherLibError::General(err.to_string()))
            }

            Ok(String::default())
        }
        Err(err) => {
            Err(LauncherLibError::HTTP { msg: "".into(), source: err })
        }
    }
}

pub fn get_auth_code(url: String) -> Option<String> {
    let query = urlparse::urlparse(url);
    match query.get_parsed_query() {
        Some(value) =>{
            match value.get("code") {
                Some(code) => {
                    match code.get(0) {
                        Some(raw) => Some(raw.clone()),
                        None => None
                    }
                },
                None => None
            }
        },
        None => None
    }
}
async fn refresh_auth_token(client_id: String, redirect_uri: String, refresh_token: String) -> LibResult<AuthoriztionJson> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let params = std::collections::HashMap::from([
        ("client_id", client_id.as_str()),
        ("refresh_token",refresh_token.as_str()),
        ("grant_type","refresh_token"),
        ("redirect_uri",redirect_uri.as_str())
    ]);


    match client.post(MS_TOKEN_AUTHORIZATION_URL).form(&params).send().await {
        Ok(value) => {
            match value.json::<AuthoriztionJson>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to make authorization request".into()
        })
    }
}

async fn get_authorization_token(client_id: String, redirect_uri: String, auth_code: String) -> LibResult<AuthoriztionJson> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let params = std::collections::HashMap::from([
        ("client_id", client_id.as_str()),
        ("redirect_uri",redirect_uri.as_str()),
        ("code",auth_code.as_str()),
        ("scope","Xboxlive.signin Xboxlive.offline_access"),
        ("grant_type","authorization_code")
    ]);

    match client.post(MS_TOKEN_AUTHORIZATION_URL).form(&params).send().await {
        Ok(value) => {
            match value.json::<AuthoriztionJson>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to make authorization request".into()
        })
    }
}

async fn authenticate_with_xbl(access_token: String) -> LibResult<XboxLiveJson> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let payload = json!({
        "Properties": {
            "AuthMethod": "RPS",
            "SiteName": "user.auth.xboxlive.com",
            "RpsTicket": format!("d={}",access_token).as_str()
        },
        "RelyingParty": "http://auth.xboxlive.com",
        "TokenType": "JWT"
     });

    match client.post(XBOX_LOGIN).json(&payload).send().await {
        Ok(res) => {
            match res.json::<XboxLiveJson>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        }
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to authenticate with xbox live".into()
        })
    }
}

async fn authenticate_with_xsts(xbl_token: String) -> LibResult<XboxLiveJson> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let payload = json!({
        "Properties": {
            "SandboxId": "RETAIL",
            "UserTokens": [
                xbl_token
            ]
        },
        "RelyingParty": "rp://api.minecraftservices.com/",
        "TokenType": "JWT"
    });

    match client.post(AUTH_XSTS).json(&payload).send().await {
        Ok(res) => {
            match res.json::<XboxLiveJson>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        },
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to authenticate with XSTS".into()
        })
    }
}

async fn authenticate_with_minecraft(userhash: String, xsts_token: String) -> LibResult<MinecraftJson> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let payload = json!({
        "identityToken": format!("XBL3.0 x={};{}",userhash,xsts_token).to_string()
    });

    match client.post(MINECRAFT_AUTH_LOGIN).json(&payload).send().await {
        Ok(res) => {
            match res.json::<MinecraftJson>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        },
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to authenticate with User though Xbox Live".into()
        })
    }
}

async fn get_minecraft_profile(token: String) -> LibResult<PlayerProfile> {
    let client = match get_http_client().await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    match client.get(MC_PROFILE).bearer_auth(token).send().await {
        Ok(res) => {
            match res.json::<PlayerProfile>().await {
                Ok(value) => Ok(value),
                Err(err) => Err(LauncherLibError::PraseJsonReqwest(err))
            }
        },
        Err(err) => Err(LauncherLibError::HTTP {
            source: err,
            msg: "Failed to get minecraft profile".into()
        })
    }
}

pub async fn login_microsoft(client_id: String, redirect_uri: String, auth_code: String) -> LibResult<Account> {
    let auth: AuthoriztionJson = match get_authorization_token(client_id, redirect_uri, auth_code).await {
        Ok(token) => token,
        Err(err) => return Err(err)
    };

    let xbl: XboxLiveJson = match authenticate_with_xbl(auth.access_token.clone()).await {
        Ok(profile) => profile,
        Err(err) => return Err(err)
    };

    let userhash = match xbl.get_userhash() {
        Some(value) => value,
        None => return Err(LauncherLibError::General("Failed to get userhash".into())) 
    };

    let xsts: XboxLiveJson = match authenticate_with_xsts(xbl.token.clone()).await {
        Ok(value) => value,
        Err(err) => {
            return Err(err);
        }
    };

    let account: MinecraftJson = match authenticate_with_minecraft(userhash, xsts.token.clone()).await {
        Ok(value) => value,
        Err(err) => {
            return Err(err);
        }
    };

    let access_token = account.access_token.clone();

    let profile: PlayerProfile = match get_minecraft_profile(access_token.clone()).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let xuid = match account.get_xuid() {
        Ok(value) => value,
        Err(err) => return Err(err)
    };


   /*  match get_xbox_profile(xsts.token, xuid.clone()).await {
        Ok(_value) => {}
        Err(err) => return Err(err)
    }*/

    Ok(Account {
        profile,
        xuid,
        access_token: access_token,
        refresh_token: auth.refresh_token
    })
}

pub async fn login_microsoft_refresh(client_id: String, redirect_uri: String, refresh_token: String) -> LibResult<Account> {
    let auth: AuthoriztionJson = match refresh_auth_token(client_id, redirect_uri, refresh_token).await {
        Ok(token) => token,
        Err(err) => return Err(err)
    };

    let xbl: XboxLiveJson = match authenticate_with_xbl(auth.access_token.clone()).await {
        Ok(profile) => profile,
        Err(err) => return Err(err)
    };

    let userhash = match xbl.display_claims.xui.get(0) {
        Some(value) => value.uhs.clone(),
        None => return Err(LauncherLibError::General("Failed to get userhash".into())) 
    };

    let xsts: XboxLiveJson = match authenticate_with_xsts(xbl.token.clone()).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let account: MinecraftJson = match authenticate_with_minecraft(userhash, xsts.token).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let access_token = account.access_token.clone();

    let profile: PlayerProfile = match get_minecraft_profile(access_token.clone()).await {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    let xuid = match account.get_xuid() {
        Ok(value) => value,
        Err(err) => return Err(err)
    };

    Ok(Account {
        profile,
        access_token: access_token,
        refresh_token: auth.refresh_token,
        xuid
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use log::{ info, error, debug };
    fn init_logger(){
        let _ = env_logger::builder().filter_level(log::LevelFilter::Trace).is_test(true).try_init();
    }
    fn shared() -> (String,String) {
        init_logger();
        let client_id = std::env::var("CLIENT_ID").expect("Expected CLIENT ID").to_string();
        let redirect_uri = "https://login.microsoftonline.com/common/oauth2/nativeclient".to_string();
        (client_id,redirect_uri)
    }
    #[test]
    fn test_ms_login_url() {
        let (client_id,redirect_uri) = shared();
        let url = ms_login_url(client_id, redirect_uri);

        info!("{}",url);
    }
    #[tokio::test]
    async fn test_login_flow() {
        let (client_id,redirect_uri) = shared();

        match login_microsoft(client_id, redirect_uri, "M.R3_BAY.8641f2bc-51d1-6d64-aa1f-add08f1e1d12".into()).await {
            Ok(_value) => {
                
            }
            Err(err) => {
                error!("{}",err);
                panic!();
            }
        }
    }
}