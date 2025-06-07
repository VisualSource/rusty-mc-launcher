import { once, type Event } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";

export type LoginResponse = {
	access_token: string;
	expires_in: number;
	id_token: string;
	refresh_token: string;
	scope: string;
	token_type: string;
};

export type ModrinthLoginResponse = {
	access_token: string;
	token_type: string;
	expires_in: number;
}

export async function modrinthAuthenticate() {
	const { resolve, reject, promise } = Promise.withResolvers<ModrinthLoginResponse>();

	const handleEvent = (ev: Event<unknown>) => {
		switch (ev.event) {
			case "rmcl-auth-login-rm-success": {
				resolve(ev.payload as ModrinthLoginResponse);
				break;
			}
			default:
				reject(new Error("Login errored", { cause: ev }));
		}
	}

	const unsubscribeError = await once("rmcl-auth-login-mr-error", handleEvent);
	const unsubscribeSuccess = await once("rmcl-auth-login-rm-success", handleEvent);

	await invoke("plugin:rmcl-auth|mr_authenticate");

	try {
		const result = await promise;
		return result;
	} catch (error) {
		throw new Error("Modrinth login failed", { cause: error });
	} finally {
		unsubscribeError();
		unsubscribeSuccess();
	}
}

const DEFAULT_SCOPES = new Set(["profile", "offline_access"]);
export async function authenticate(scopes: string[]) {
	const { reject, resolve, promise } = Promise.withResolvers<LoginResponse>();
	const handleEvent = (ev: Event<unknown>) => {
		switch (ev.event) {
			case "rmcl-auth-login-success": {
				resolve(ev.payload as LoginResponse);
				break;
			}
			default:
				reject(new Error("Login failed", { cause: ev }));
				break;
		}
	};

	const onError = await once("rmcl-auth-login-error", handleEvent);
	const onSuccess = await once("rmcl-auth-login-success", handleEvent);

	await invoke("plugin:rmcl-auth|authenticate", {
		scopes: Array.from(new Set(scopes).union(DEFAULT_SCOPES)),
	});

	try {
		const result = await promise;

		return result;
	} catch (error) {
		throw new Error("Microsoft login failed!", { cause: error });
	} finally {
		onError();
		onSuccess();
	}
}

export async function refresh(token: string): Promise<LoginResponse> {
	return invoke("plugin:rmcl-auth|refresh", { token });
}

export async function logout(): Promise<void> {
	return invoke("plugin:rmcl-auth|logout");
}
