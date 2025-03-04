import { invoke } from "@tauri-apps/api/core";

/** @deprecated */
export async function startAuthServer() {
	return 8000;
	//return invoke<number>("plugin:rmcl-auth|start_auth_server");
}
/** @deprecated */
export async function closeAuthServer(port: number) {
	//return invoke<void>("plugin:rmcl-auth|close_auth_server", { port: port });
}

const DEFAULT_SCOPES = new Set(["User.Read", "openid", "profile", "offline_access"]);
export async function authenticate(scopes: string[]) {
	return invoke<true>("plugin:rmcl-auth|authenticate", {
		scopes: Array.from(new Set(scopes).union(DEFAULT_SCOPES))
	});
}