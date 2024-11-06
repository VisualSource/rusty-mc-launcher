import { type UnlistenFn, once } from "@tauri-apps/api/event";
import { onOpenUrl } from '@tauri-apps/plugin-deep-link';
import { open } from "@tauri-apps/plugin-shell";
import {
	BrowserAuthErrorCodes,
	createBrowserAuthError,
} from "@masl/error/BrowserAuthError";
import { auth } from "@system/logger";
import { toast } from "react-toastify";

export type AuthResponse = {
	access_token: string;
	token_type: "Bearer";
	expires_in: number;
};

const TEN_MINS = 600_000;
const MODRINTH_REDIRECT = "rmcl://modrinth/authorize";
const MODRINTH_GET_TOKEN = "https://api.modrinth.com/_internal/oauth/token";
const MODRITH_AUTHORIZE = "https://modrinth.com/auth/authorize";
export class PopupClient {
	currentWindow: Window | undefined;
	public acquireToken() {
		try {
			const res = this.acquireTokenPopupAsync();
			toast.success("Logged into Modrinth");
			return res;
		} catch (error) {
			toast.error("Modrinth Login failed", { data: error });
			return Promise.reject(error);
		}
	}

	private async acquireTokenPopupAsync() {
		const signinURL = `${MODRITH_AUTHORIZE}?client_id=${import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID}&redirect_uri=${MODRINTH_REDIRECT}&scope=${import.meta.env.PUBLIC_VITE_MODRINTH_SCOPES}`;

		const responseString = await this.waitForCode(signinURL);

		const params = new URLSearchParams([
			["code", responseString],
			["grant_type", "authorization_code"],
			["client_id", import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID],
			["redirect_uri", MODRINTH_REDIRECT]
		]);

		/**
		 * For how to send and format the request
		 * @see https://stackoverflow.com/questions/40998133/content-type-for-token-request-in-oauth2
		 * @see https://auth0.com/docs/api/authentication#get-token45
		 *
		 *
		 * For where "client_secret" is set
		 * @see https://github.com/modrinth/labrinth/blob/master/src/auth/oauth/mod.rs#L202-L204
		 */

		const response = await fetch(MODRINTH_GET_TOKEN, {
			method: "POST",
			headers: {
				Authorization: import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_SECRET,
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: params,
		});

		if (!response.ok) {
			throw createBrowserAuthError(BrowserAuthErrorCodes.postRequestFailed);
		}

		return response.json() as Promise<AuthResponse>;
	}

	private async waitForCode(url: string): Promise<string> {
		let timer: NodeJS.Timeout | undefined;

		const timeout = new Promise<never>((_, reject) => {
			timer = setTimeout(() => reject(new Error("Timeout")), TEN_MINS);
		});

		const event = new EventTarget();
		const unlisten = await onOpenUrl((urls) => {
			try {
				const url = urls.at(0);
				if (!url) throw new Error("No urls returned");
				const item = new URL(url);
				const code = item.searchParams.get("code");
				if (!code) throw new Error("Failed to get code");
				event.dispatchEvent(new CustomEvent<string>("open", { detail: code }));
			} catch (error) {
				event.dispatchEvent(new CustomEvent("error", { detail: error }));
			}
		});

		const resultHandler = new Promise<string>((reslove, reject) => {
			event.addEventListener("open", (ev) => reslove((ev as CustomEvent<string>).detail));
			event.addEventListener("error", (ev) => reject((ev as CustomEvent<Error>).detail))
		});

		await open(url);
		return Promise.race([resultHandler, timeout]).finally(() => {
			clearTimeout(timer);
			unlisten();
		});
	}
}

