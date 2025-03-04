import { invoke } from "@tauri-apps/api/core";

/** @deprecated */
export async function startAuthServer() {
	//return invoke<number>("plugin:rmcl-auth|start_auth_server");
}
/** @deprecated */
export async function closeAuthServer(port: number) {
	//return invoke<void>("plugin:rmcl-auth|close_auth_server", { port: port });
}

const DEFAULT_SCOPES = new Set(["User.Read", "openid", "profile", "offline_access"]);
export async function authenticate(scopes: string[]) {
	return invoke<true>("plugin:rmcl-auth|authenticate", {
		scopes: Array.from(DEFAULT_SCOPES.union(new Set(scopes)))
	});
}

/*

https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?scope=User.Read%20XboxLive.SignIn%20XboxLive.offline_access%20openid%20profile%20offline_access
// client_id=82004760-68b9-4cc1-bd83-d9d785e9b7c4&
// scope=User.Read%20XboxLive.SignIn%20XboxLive.offline_access%20openid%20profile%20offline_access
// &redirect_uri=http%3A%2F%2Flocalhost%3Aundefined&client-request-id=01955e76-5f69-7b08-8e34-cc5513362eb6&response_mode=fragment&response_type=code&x-client-SKU=msal.js.browser&x-client-VER=3.28.1&client_info=1&code_challenge=mwli1OvbQ6J6BECPUZ8vmrfEgMD0-uEHWdCMbm__0qY&code_challenge_method=S256&prompt=select_account&nonce=01955e76-5f81-7d71-9250-c10d6a2d499b&state=eyJpZCI6IjAxOTU1ZTc2LTVmNzItN2U4Zi1hZDNhLTkxMDJhNzEzMjY4NCIsIm1ldGEiOnsiaW50ZXJhY3Rpb25UeXBlIjoicG9wdXAifX0%3D


*/