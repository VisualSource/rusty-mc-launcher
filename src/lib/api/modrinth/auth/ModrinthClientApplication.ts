import { addSeconds } from "date-fns/addSeconds";
import {
	BrowserAuthError,
	BrowserAuthErrorCodes,
	type Configuration,
	type EndSessionRequest,
	type PopupRequest,
} from "@masl/index";
import { modrinthClient } from "../../modrinthClient";
import {
	getUserFromAuth,
	getUserNotifications,
	getFollowedProjects,
	readNotifications,
	readNotification,
	deleteNotifications,
	deleteNotification,
	followProject,
	unfollowProject,
} from "../services.gen";
import { PopupClient } from "./PopupClient";
import { auth } from "@/lib/system/logger";
import type { User } from "../types.gen";
import { queryClient } from "../../queryClient";

export type AuthenticationResult = {
	tokenType: string;
	accessToken: string;
	account: User | null;
	authority: string;
	expiresOn: Date | null;
	fromCache: boolean;
};

const ACCOUNT_KEY = "modrinth.account";

const sterilize = (_key: string, value: unknown) => {
	if (value instanceof Date) {
		return `Date(${value.toISOString()})`;
	}

	return value;
};

const desterilize = (_key: string, value: unknown) => {
	if (typeof value === "string" && value.startsWith("Date(")) {
		return new Date(value.replace("Date(", "").replace(")", ""));
	}
	return value;
};

export class ModrinthClientApplication extends EventTarget {
	private data: AuthenticationResult | null = null;

	public static async createPublicClientApplication(
		_configuration?: Configuration,
	): Promise<ModrinthClientApplication> {
		const pca = new ModrinthClientApplication();
		await pca.initialize();
		return pca;
	}

	public get isAuthed(): boolean {
		return this.data !== null;
	}

	async followProject(id: string) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);

		const { error, response } = await followProject({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				"id|slug": id,
			},
		});
		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });

		await queryClient.invalidateQueries({ queryKey: ["MODRINTH", "FOLLOWS"] });
	}

	async unfollowProject(id: string) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);

		const { error, response } = await unfollowProject({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				"id|slug": id,
			},
		});
		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });

		await queryClient.invalidateQueries({ queryKey: ["MODRINTH", "FOLLOWS"] });
	}

	async getFollowed() {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);

		const { error, data, response } = await getFollowedProjects({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				"id|username": this.data?.account.id,
			},
		});

		if (error) throw error;
		if (!response.ok || !data)
			throw new Error("Failed to get user followed projects.", {
				cause: response,
			});

		return data;
	}

	async getNotifications() {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);

		const { error, data, response } = await getUserNotifications({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				"id|username": this.data.account.id,
			},
		});

		if (error) throw error;
		if (!response.ok || !data)
			throw new Error("Failed to get user notifications", { cause: response });

		return data;
	}

	async readNotification(id: string) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);

		const { response, error } = await readNotification({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				id,
			},
		});

		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });
	}
	async readNotifications(ids: string[]) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);
		const { response, error } = await readNotifications({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			query: {
				ids: JSON.stringify(ids),
			},
		});

		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });
	}
	async deleteNotification(id: string) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);
		const { response, error } = await deleteNotification({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			path: {
				id,
			},
		});

		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });
	}
	async deleteNotifications(ids: string) {
		if (!this.data?.account)
			throw new BrowserAuthError(
				BrowserAuthErrorCodes.authCodeOrNativeAccountIdRequired,
			);
		const { response, error } = await deleteNotifications({
			client: modrinthClient,
			headers: {
				Authorization: this.data.accessToken,
			},
			query: {
				ids: JSON.stringify(ids),
			},
		});

		if (error) throw error;
		if (!response.ok)
			throw new Error("Failed to read notification", { cause: response });
	}

	async initialize(): Promise<void> {
		try {
			this.data = this.readCache();
		} catch (error) {
			auth.error(
				`Failed to load modrinth cache: ${(error as Error).message}`,
				error,
			);
		}
	}
	async acquireTokenPopup(): Promise<AuthenticationResult> {
		const client = this.createPopupClient();
		const token = await client.acquireToken();

		this.data = {
			tokenType: token.token_type,
			accessToken: token.access_token,
			account: this.data?.account,
			authority: "modrinth",
			expiresOn: addSeconds(new Date(), token.expires_in),
			fromCache: false,
		} as AuthenticationResult;

		this.writeCache(this.data);

		return this.data;
	}
	async acquireTokenSilent(): Promise<string> {
		if (this.data) return this.data.accessToken;

		throw new BrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);
	}
	async loginPopup(
		_request?: PopupRequest | undefined,
	): Promise<AuthenticationResult> {
		const account = await this.acquireTokenPopup();

		const response = await getUserFromAuth({
			client: modrinthClient,
			headers: {
				Authorization: account.accessToken,
			},
		});
		if (response.error) throw response.error;
		if (!response.response.ok || !response.data)
			throw new BrowserAuthError(BrowserAuthErrorCodes.getRequestFailed);

		if (!this.data)
			throw new BrowserAuthError(BrowserAuthErrorCodes.noAccountError);
		this.data.account = response.data;

		this.writeCache(this.data);

		this.dispatchEvent(new Event("update-data"));

		return this.data;
	}
	public async logout(
		_logoutRequest?: EndSessionRequest | undefined,
	): Promise<void> {
		this.data = null;
		this.clearCache();
		await queryClient.invalidateQueries({ queryKey: ["MODRINTH", "FOLLOWS"] });
		this.dispatchEvent(new Event("update-data"));
	}
	public getActiveAccount(): User | null {
		if (this.data?.account) return this.data.account;

		return null;
	}
	public clearCache(): void {
		localStorage.removeItem(ACCOUNT_KEY);
	}
	private writeCache(data: AuthenticationResult) {
		localStorage.setItem(ACCOUNT_KEY, JSON.stringify(data, sterilize));
	}
	private readCache(): AuthenticationResult | null {
		const cache = localStorage.getItem(ACCOUNT_KEY);
		if (!cache) return null;
		return JSON.parse(cache, desterilize) as AuthenticationResult;
	}
	private createPopupClient() {
		return new PopupClient();
	}
}
