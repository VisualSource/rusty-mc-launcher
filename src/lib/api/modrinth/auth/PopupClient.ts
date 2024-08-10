import { type UnlistenFn, once } from "@tauri-apps/api/event";
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
const MODRINTH_REDIRECT = "rmcl://modrinth_auth/authorize";
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
		const signinURL = `${MODRITH_AUTHORIZE}?client_id=${encodeURIComponent(import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID)}&redirect_uri=${encodeURIComponent(MODRINTH_REDIRECT)}&scope=${encodeURIComponent(import.meta.env.PUBLIC_VITE_MODRINTH_SCOPES)}`;
		await open(signinURL);

		const responseString = await this.waitForCode();

		const params = new URLSearchParams(responseString);

		if (!params.get("code"))
			throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);

		params.set("grant_type", "authorization_code");
		params.set("client_id", import.meta.env.PUBLIC_VITE_MODRINTH_CLIENT_ID);
		params.set("redirect_uri", MODRINTH_REDIRECT);

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

	private waitForCode() {
		let intervalId: NodeJS.Timeout | undefined;
		let unlisten: Promise<UnlistenFn> | undefined;

		const hasHandler = new Promise<string>((resolve) => {
			unlisten = once<string>(MODRINTH_REDIRECT, (ev) => {
				resolve(ev.payload);
			});
		});

		const closeHandler = new Promise<string>((_, reject) => {
			intervalId = setTimeout(() => {
				auth.error("PopupHandler.monitorPopupForHash - window closed");
				reject(createBrowserAuthError(BrowserAuthErrorCodes.userCancelled));
				return;
			}, TEN_MINS);
		});

		return Promise.race([closeHandler, hasHandler]).finally(() => {
			clearInterval(intervalId);
			unlisten?.then((unsub) => unsub()).catch((e) => auth.error(e));
		});
	}
}
