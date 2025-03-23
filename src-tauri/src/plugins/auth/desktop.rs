//! Authorization Code Grant w/ PKCE
//! https://docs.rs/oauth2/latest/oauth2/index.html#other-examples
//! https://learn.microsoft.com/en-us/entra/identity-platform/v2-oauth2-auth-code-flow
//! https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-browser/docs/login-user.md
//! https://openid.net/specs/openid-connect-core-1_0.html#HybridIDToken
//!
use crate::error::{Error, Result};
use openidconnect::{
    AuthorizationCode, AuthorizationCodeHash, ClientId, CsrfToken, EmptyAdditionalClaims,
    EmptyExtraTokenFields, EndpointMaybeSet, EndpointNotSet, EndpointSet, IdToken, IdTokenFields,
    JsonWebKeySet, Nonce, PkceCodeChallenge, PkceCodeVerifier, RedirectUrl, Scope,
    StandardErrorResponse, StandardTokenResponse,
    core::{
        CoreAuthenticationFlow, CoreClient, CoreErrorResponseType, CoreGenderClaim, CoreJsonWebKey,
        CoreJweContentEncryptionAlgorithm, CoreJwsSigningAlgorithm, CoreProviderMetadata,
        CoreResponseType, CoreTokenType,
    },
};
use std::{collections::HashMap, str::FromStr};
use tauri::{Emitter, Manager, Url};
use tauri_plugin_http::reqwest::{ClientBuilder, redirect::Policy};
use tokio::sync::Mutex;

pub type AuthAppState = Mutex<AuthState>;
pub type AuthResponse = StandardTokenResponse<
    IdTokenFields<
        EmptyAdditionalClaims,
        EmptyExtraTokenFields,
        CoreGenderClaim,
        CoreJweContentEncryptionAlgorithm,
        CoreJwsSigningAlgorithm,
    >,
    CoreTokenType,
>;

pub const EVENT_LOGIN_WINDOW_DESTORYED: &str = "rmcl-auth-login-window-destroyed";
/// Note: You must use the consumers AAD tenant to sign in with the XboxLive.signin scope.
/// Dissover: v2.0/.well-known/openid-configuration
pub const AUTHORITY: &str =
    "https://login.microsoftonline.com/consumers/v2.0/.well-known/openid-configuration";
const SCOPES_SUBSET: &str = "XboxLive.SignIn XboxLive.offline_access openid profile offline_access";
pub const CALLBACK_URI: &str = "rmcl://ms/authorize";

struct FragmentParams(HashMap<String, String>);

impl FragmentParams {
    fn from_url(value: Url) -> Self {
        if let Some(fragment) = value.fragment() {
            let mut map = HashMap::with_capacity(3);

            for item in fragment.split('&') {
                if let Some((key, value)) = item.split_once('=') {
                    map.insert(key.to_owned(), value.to_owned());
                }
            }

            return Self(map);
        }
        Self(HashMap::with_capacity(0))
    }
    fn get_param(&self, param: &str) -> Option<&String> {
        self.0.get(param)
    }
}

pub struct AuthState {
    pub flow: Option<(CsrfToken, PkceCodeVerifier, Nonce)>,
    pub client: CoreClient<
        EndpointSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointNotSet,
        EndpointMaybeSet,
        EndpointMaybeSet,
    >,
}

impl AuthState {
    pub fn new() -> Result<Self> {
        let client_id = ClientId::new(env!("VITE_CLIENT_ID").to_string());
        let http_client = tauri_plugin_http::reqwest::blocking::ClientBuilder::new().build()?;
        let provider: CoreProviderMetadata = http_client.get(AUTHORITY).send()?.json()?;

        let jwks: JsonWebKeySet<CoreJsonWebKey> = http_client
            .get(provider.jwks_uri().to_string())
            .send()?
            .json()?;
        let provider = provider.set_jwks(jwks);

        let client = CoreClient::from_provider_metadata(provider, client_id, None)
            .set_redirect_uri(RedirectUrl::new(CALLBACK_URI.to_string())?);

        Ok(Self { flow: None, client })
    }

    fn is_code_valid(&self, raw_id_token: &str, raw_code: String, nonce: &Nonce) -> Result<bool> {
        let id_token: IdToken<
            openidconnect::EmptyAdditionalClaims,
            CoreGenderClaim,
            CoreJweContentEncryptionAlgorithm,
            CoreJwsSigningAlgorithm,
        > = IdToken::from_str(raw_id_token)?;
        let code = AuthorizationCode::new(raw_code);

        let id_token_verifer = self.client.id_token_verifier();
        let claims = id_token.claims(&id_token_verifer, nonce)?;
        if let Some(c_hash) = claims.code_hash() {
            let hash = AuthorizationCodeHash::from_code(
                &code,
                id_token.signing_alg()?,
                id_token.signing_key(&id_token_verifer)?,
            )?;

            return Ok(hash == *c_hash);
        }

        Ok(false)
    }
    /// generate login url for hybird flow
    pub fn generate_url(&mut self, scopes: Vec<Scope>) -> Result<Url> {
        let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

        let (auth_url, csrf_token, nonce) = self
            .client
            .authorize_url(
                CoreAuthenticationFlow::Hybrid(vec![
                    CoreResponseType::Code,
                    CoreResponseType::IdToken,
                ]),
                CsrfToken::new_random,
                Nonce::new_random,
            )
            .add_scopes(scopes)
            .set_pkce_challenge(pkce_challenge)
            .url();

        self.flow = Some((csrf_token, pkce_verifier, nonce));

        // the url scopes get concated with '+' by the url package but microsoft oauth expects a space sepearted list of scopes.
        // so we replace '+' with url expected space
        let rurl = auth_url.to_string().replace('+', "%20");
        let url = Url::parse(&rurl)?;

        Ok(url)
    }

    pub async fn validate(&mut self, url: Url) -> Result<AuthResponse> {
        let fragment = FragmentParams::from_url(url);
        if let Some(code) = fragment.get_param("error") {
            let description = fragment
                .get_param("error_description")
                .map_or("Unknown Error".to_string(), |x| x.to_owned());

            return Err(Error::Reason(format!(
                r#""code":"{}","reason":"{}""#,
                code, description
            )));
        }

        let code = fragment
            .get_param("code")
            .ok_or_else(|| Error::Reason("Failed to get param 1".to_string()))?;
        let id_token = fragment
            .get_param("id_token")
            .ok_or_else(|| Error::Reason("Failed to get param 2".to_string()))?;
        let state = fragment
            .get_param("state")
            .ok_or_else(|| Error::Reason("Failed to get param 3".to_string()))?;

        let http_client = ClientBuilder::new().redirect(Policy::none()).build()?;
        let (crsf, pkce_verifier, nonce) = self
            .flow
            .take()
            .ok_or_else(|| Error::Reason("Invalid flow".to_string()))?;

        if crsf.secret() != state {
            return Err(Error::Reason("Invalid state".to_string()));
        }
        if !self.is_code_valid(id_token, code.clone(), &nonce)? {
            return Err(Error::Reason("Invalid code".to_string()));
        }

        let token_url = self
            .client
            .token_uri()
            .ok_or_else(|| Error::Reason("Failed to get token url".to_string()))?;

        let mut params = HashMap::new();
        params.insert("code", code.to_owned());
        params.insert("scope", SCOPES_SUBSET.to_string());
        params.insert("client_id", self.client.client_id().to_string());
        params.insert(
            "redirect_uri",
            self.client
                .redirect_uri()
                .ok_or_else(|| Error::Reason("Failed to get redirect".to_string()))?
                .to_string(),
        );
        params.insert("grant_type", "authorization_code".to_string());
        params.insert("code_verifier", pkce_verifier.into_secret());

        let response = http_client
            .post(token_url.as_str())
            .form(&params)
            .send()
            .await?;

        let status = response.status();
        if !status.is_success() {
            let error_data = response
                .json::<StandardErrorResponse<CoreErrorResponseType>>()
                .await?;

            log::error!("{}", error_data);

            return Err(Error::Auth(error_data));
        }

        let data = response.json::<AuthResponse>().await?;

        Ok(data)
    }

    pub async fn refresh(&self, refresh_token: &str) -> Result<AuthResponse> {
        let token_url = self
            .client
            .token_uri()
            .ok_or_else(|| Error::Reason("Missing token url".to_string()))?
            .to_string();

        let http_client = ClientBuilder::new().redirect(Policy::none()).build()?;

        let mut params = HashMap::new();

        params.insert("client_id", self.client.client_id().as_str());
        params.insert("scope", SCOPES_SUBSET);
        params.insert("grant_type", "refresh_token");
        params.insert("refresh_type", "refresh_token");
        params.insert("refresh_token", refresh_token);

        let response = http_client.post(token_url).form(&params).send().await?;
        let status = response.status();
        if !status.is_success() {
            let error_data = response
                .json::<StandardErrorResponse<CoreErrorResponseType>>()
                .await?;

            log::error!("{}", error_data);

            return Err(Error::Auth(error_data));
        }

        let data = response.json::<AuthResponse>().await?;

        Ok(data)
    }
}

pub fn is_valid_callback(url: &Url) -> bool {
    url.as_str().starts_with(CALLBACK_URI)
}

pub async fn validate_code<R: tauri::Runtime>(app: tauri::AppHandle<R>, url: Url) -> Result<()> {
    let state = app.state::<AuthAppState>();
    let mut ls = state.lock().await;

    let result = ls.validate(url).await;

    match result {
        Ok(data) => {
            if let Err(err) = app.emit("rmcl-auth-login-success", data) {
                log::error!("{}", err.to_string());
            }
        }
        Err(error) => {
            if let Err(err) = app.emit("rmcl-auth-login-error", error.to_string()) {
                log::error!("{}", err.to_string());
            }
        }
    }

    if let Some(win) = app.get_webview_window("login") {
        if let Err(err) = win.close() {
            log::error!("{}", err);
        }
    }

    Ok(())
}
