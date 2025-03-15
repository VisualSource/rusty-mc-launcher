import { invoke } from "@tauri-apps/api/core";
import { once, type UnlistenFn, type Event } from "@tauri-apps/api/event";


export type LoginResponse = {
	access_token: string;
	expires_in: number;
	id_token: string;
	refresh_token: string;
	scope: string;
	token_type: string;
}

const DEFAULT_SCOPES = new Set(["profile", "offline_access"]);
export async function authenticate(scopes: string[]) {
	const result = new Promise<LoginResponse>((ok, reject) => {
		let onSuccess: Promise<UnlistenFn> | undefined = undefined;
		let onError: Promise<UnlistenFn> | undefined = undefined;
		const handleEvent = (ev: Event<unknown>) => {
			switch (ev.event) {
				case "rmcl-auth-login-error":
					reject(new Error(ev.payload as string));
					break;
				case "rmcl-auth-login-success": {
					ok(ev.payload as LoginResponse);
					break;
				}
				default:
					reject(new Error(`Unknown event "${ev.event}"`, { cause: ev }));
					break;
			}
			Promise.all([onSuccess, onError]).then(e => {
				for (const unsub of e) unsub?.call(null);
			}).catch(e => console.error(e));
		}

		onError = once("rmcl-auth-login-error", handleEvent);
		onSuccess = once("rmcl-auth-login-success", handleEvent);
	});
	await invoke("plugin:rmcl-auth|authenticate", {
		scopes: Array.from(new Set(scopes).union(DEFAULT_SCOPES))
	});

	return result;
}


export async function refresh(token: string): Promise<LoginResponse> {
	return invoke("plugin:rmcl-auth|refresh", { token });
}

export async function logout(): Promise<void> {
	return invoke("plugin:rmcl-auth|logout");
}