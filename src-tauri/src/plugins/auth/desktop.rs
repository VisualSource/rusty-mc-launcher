//! Authorization Code Grant w/ PKCE
//! https://docs.rs/oauth2/latest/oauth2/index.html#other-examples
//! https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
//! https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md
//!
use crate::error::{Error, Result};
use oauth2::{
    basic::BasicClient,
    basic::{BasicErrorResponseType, BasicTokenType},
    AuthUrl, AuthorizationCode, Client, ClientId, CsrfToken, EmptyExtraTokenFields, EndpointNotSet,
    EndpointSet, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, RefreshToken,
    RevocationErrorResponseType, Scope, StandardErrorResponse, StandardRevocableToken,
    StandardTokenIntrospectionResponse, StandardTokenResponse, TokenResponse, TokenUrl,
};
use serde::Serialize;
use std::collections::HashMap;
use tauri::Manager;
use tauri::{Emitter, Url};
use tauri_plugin_http::reqwest;
use tokio::sync::Mutex;

pub type AuthAppState = Mutex<AuthState>;
/// Note: You must use the consumers AAD tenant to sign in with the XboxLive.signin scope.
pub const AUTHORITY_ROOT: &str = "https://login.microsoftonline.com/consumers";
const SCOPES_SUBSET: &str = "User.Read openid profile offline_access";
pub const CALLBACK_URI: &str = "rmcl://ms/authorize";

#[derive(Debug, Serialize, Clone)]
pub struct LoginResponse {
    access_token: String,
    refresh_token: Option<String>,
}
impl LoginResponse {
    pub fn new(access_token: String, refresh_token: Option<String>) -> Self {
        Self {
            access_token,
            refresh_token,
        }
    }
}

struct QueryParams(Vec<(String, String)>);
impl QueryParams {
    fn from_url(url: Url) -> Self {
        let pairs = url.query_pairs().into_owned();

        let mut params = Vec::with_capacity(2);

        for (key, value) in pairs {
            params.push((key, value));
        }

        Self(params)
    }
    fn get_param(&self, param: &str) -> Option<String> {
        let item = self.0.iter().find(|(key, _)| key == param);

        item.map(|(_, value)| value.to_owned())
    }
}

pub fn is_valid_callback(url: &Url) -> bool {
    url.as_str().starts_with(CALLBACK_URI)
}

pub async fn validate_code<R: tauri::Runtime>(app: tauri::AppHandle<R>, url: Url) -> Result<()> {
    let state = app.state::<AuthAppState>();
    let mut ls = state.lock().await;

    let result = ls.validate(url).await;
    log::debug!("LOGIN result: {:#?}", result);

    match result {
        Ok(data) => {
            if let Err(err) = app.emit("login-success", data) {
                log::error!("{}", err.to_string());
            }
        }
        Err(error) => {
            if let Err(err) = app.emit("login-error", error.to_string()) {
                log::error!("{}", err.to_string());
            }
        }
    }

    Ok(())
}

pub struct AuthState {
    pub flows: HashMap<String, PkceCodeVerifier>,
    pub client: Client<
        StandardErrorResponse<BasicErrorResponseType>,
        StandardTokenResponse<EmptyExtraTokenFields, BasicTokenType>,
        StandardTokenIntrospectionResponse<EmptyExtraTokenFields, BasicTokenType>,
        StandardRevocableToken,
        StandardErrorResponse<RevocationErrorResponseType>,
        EndpointSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointSet,
    >,
}

impl AuthState {
    pub fn new() -> Result<Self> {
        let client_id = ClientId::new(env!("VITE_CLIENT_ID").to_string());
        let auth_url = AuthUrl::new(format!("{}/oauth2/v2.0/authorize", AUTHORITY_ROOT))?;
        let token_url = TokenUrl::new(format!("{}/oauth2/v2.0/token", AUTHORITY_ROOT))?;
        let redirect_url = RedirectUrl::new(CALLBACK_URI.to_string())?;

        let client = BasicClient::new(client_id)
            .set_redirect_uri(redirect_url)
            .set_auth_uri(auth_url)
            .set_token_uri(token_url);

        Ok(Self {
            flows: HashMap::new(),
            client,
        })
    }

    pub fn generate_url(&mut self, scopes: Vec<Scope>) -> Result<String> {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();
        let (auth_url, csrf_token) = self
            .client
            .authorize_url(CsrfToken::new_random)
            .add_scopes(scopes)
            .set_pkce_challenge(pkce_challenge)
            .url();

        let token_str = csrf_token.into_secret();
        self.flows.insert(token_str, pkce_verifier);

        // the url scopes get concated with '+' by the url package but microsoft oauth expects a space sepearted list of scopes.
        // so we replace '+' with url expected space
        let url = auth_url.to_string().replace('+', "%20");

        Ok(url)
    }

    pub async fn refresh(&self, refresh_token: &String) -> Result<LoginResponse> {
        let refresh = RefreshToken::new(refresh_token.to_owned());

        let http = reqwest::ClientBuilder::new()
            .redirect(reqwest::redirect::Policy::none())
            .build()?;

        let response = self
            .client
            .exchange_refresh_token(&refresh)
            .add_extra_param("scope", SCOPES_SUBSET)
            .request_async(&http)
            .await?;

        let at = response.access_token().secret();
        let rt = response.refresh_token().map(|x| x.secret().to_owned());

        Ok(LoginResponse::new(at.to_owned(), rt))
    }

    pub async fn validate(&mut self, url: Url) -> Result<LoginResponse> {
        let query = QueryParams::from_url(url);

        if let Some(code) = query.get_param("error") {
            let description = query
                .get_param("error_description")
                .unwrap_or("Unknown Error".to_string());
            return Err(Error::Reason(format!(
                r#""code":"{}","reason":"{}""#,
                code, description
            )));
        }

        let code = query
            .get_param("code")
            .ok_or_else(|| Error::Reason("Missing param 1".to_string()))?;
        let auth_code = AuthorizationCode::new(code);

        let state = query
            .get_param("state")
            .ok_or_else(|| Error::Reason("Missing param 3".to_string()))?;
        let pkce = self.flows.remove(&state).ok_or(Error::Reason(
            "Failed to find authentication flow".to_string(),
        ))?;

        let http = reqwest::ClientBuilder::new()
            .redirect(reqwest::redirect::Policy::none())
            .build()?;

        let response = self
            .client
            .exchange_code(auth_code)
            .add_extra_param("scope", SCOPES_SUBSET)
            .set_pkce_verifier(pkce)
            .request_async(&http)
            .await?;

        let at = response.access_token().secret();
        let rt = response.refresh_token().map(|x| x.secret().to_owned());

        Ok(LoginResponse::new(at.to_owned(), rt))
    }
}
