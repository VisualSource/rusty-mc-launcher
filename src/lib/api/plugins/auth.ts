import { invoke } from "@tauri-apps/api/core";

const DEFAULT_SCOPES = new Set(["User.Read", "profile", "offline_access"]);
export async function authenticate(scopes: string[]) {
	console.log(scopes);
	return invoke<true>("plugin:rmcl-auth|authenticate", {
		scopes: Array.from(new Set(scopes).union(DEFAULT_SCOPES))
	});
}

export async function logout(): Promise<void> {
	return invoke("plugin:rmcl-auth|logout");
}