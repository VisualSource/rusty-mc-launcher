//import { compareAsc } from "date-fns/compareAsc";
//import { addSeconds } from "date-fns/addSeconds";
//import { UsersService } from "../services.gen";
//import { OpenAPI } from "../core/OpenAPI";
import type {
	AccountInfo,
	AuthenticationResult,
	AuthorizationCodeRequest,
	BrowserConfiguration,
	ClearCacheRequest,
	Configuration,
	EndSessionPopupRequest,
	EndSessionRequest,
	EventCallbackFunction,
	INavigationClient,
	IPublicClientApplication,
	ITokenCache,
	Logger,
	PerformanceCallbackFunction,
	PopupRequest,
	RedirectRequest,
	SilentRequest,
	SsoSilentRequest,
	WrapperSKU,
} from "@masl/index";
import type { AccountFilter } from "@azure/msal-common";
/*import { type AuthResponse, PopupClient } from "./PopupClient";
import {
	BrowserAuthErrorCodes,
	createBrowserAuthError,
} from "@/lib/masl/error/BrowserAuthError";
import { auth } from "@/lib/system/logger";*/
//import { AccountFilter } from "@azure/msal-common";

//type CachedToken = Omit<AuthResponse, "expires_in"> & { expires: string };
//type AccountInfo = Awaited<ReturnType<typeof UsersService.getUser>>;
//type SilentRequest = { account?: AccountInfo };

export class ModrinthClientApplication implements IPublicClientApplication {
	public static async createPublicClientApplication(
		_configuration?: Configuration,
	): Promise<IPublicClientApplication> {
		const pca = new ModrinthClientApplication();
		return pca;
	}

	initialize(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	acquireTokenPopup(_request: PopupRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	acquireTokenRedirect(_request: RedirectRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	acquireTokenSilent(
		_silentRequest: SilentRequest,
	): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	acquireTokenByCode(
		_request: AuthorizationCodeRequest,
	): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	addEventCallback(_callback: EventCallbackFunction): string | null {
		throw new Error("Method not implemented.");
	}
	removeEventCallback(_callbackId: string): void {
		throw new Error("Method not implemented.");
	}
	addPerformanceCallback(_callback: PerformanceCallbackFunction): string {
		throw new Error("Method not implemented.");
	}
	removePerformanceCallback(_callbackId: string): boolean {
		throw new Error("Method not implemented.");
	}
	enableAccountStorageEvents(): void {
		throw new Error("Method not implemented.");
	}
	disableAccountStorageEvents(): void {
		throw new Error("Method not implemented.");
	}
	getAccount(_accountFilter: AccountFilter): AccountInfo | null {
		throw new Error("Method not implemented.");
	}
	getAccountByHomeId(_homeAccountId: string): AccountInfo | null {
		throw new Error("Method not implemented.");
	}
	getAccountByLocalId(_localId: string): AccountInfo | null {
		throw new Error("Method not implemented.");
	}
	getAccountByUsername(_userName: string): AccountInfo | null {
		throw new Error("Method not implemented.");
	}
	getAllAccounts(): AccountInfo[] {
		throw new Error("Method not implemented.");
	}
	handleRedirectPromise(
		_hash?: string | undefined,
	): Promise<AuthenticationResult | null> {
		throw new Error("Method not implemented.");
	}
	loginPopup(
		_request?: PopupRequest | undefined,
	): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	loginRedirect(_request?: RedirectRequest | undefined): Promise<void> {
		throw new Error("Method not implemented.");
	}
	logout(_logoutRequest?: EndSessionRequest | undefined): Promise<void> {
		throw new Error("Method not implemented.");
	}
	logoutRedirect(
		_logoutRequest?: EndSessionRequest | undefined,
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	logoutPopup(
		_logoutRequest?: EndSessionPopupRequest | undefined,
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	ssoSilent(_request: SsoSilentRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	getTokenCache(): ITokenCache {
		throw new Error("Method not implemented.");
	}
	getLogger(): Logger {
		throw new Error("Method not implemented.");
	}
	setLogger(_logger: Logger): void {
		throw new Error("Method not implemented.");
	}
	setActiveAccount(_account: AccountInfo | null): void {
		throw new Error("Method not implemented.");
	}
	getActiveAccount(): AccountInfo | null {
		throw new Error("Method not implemented.");
	}
	initializeWrapperLibrary(_sku: WrapperSKU, _version: string): void {
		throw new Error("Method not implemented.");
	}
	setNavigationClient(_navigationClient: INavigationClient): void {
		throw new Error("Method not implemented.");
	}
	getConfiguration(): BrowserConfiguration {
		throw new Error("Method not implemented.");
	}
	hydrateCache(
		_result: AuthenticationResult,
		_request: PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest,
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	clearCache(_logoutRequest?: ClearCacheRequest | undefined): Promise<void> {
		throw new Error("Method not implemented.");
	}
	/*initialize(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	public async acquireTokenPopup(): Promise<AuthenticationResult> {
		const client = this.createPopupClient();
		const token = await client.acquireToken();

		const addHeader = (request: RequestInit) => {
			request.headers = new Headers(request.headers);
			request.headers.append("Authorization", token.access_token);
			return request;
		};

		OpenAPI.interceptors.request.use(addHeader);
		const response = await UsersService.getUserFromAuth();
		OpenAPI.interceptors.request.eject(addHeader);

		localStorage.setItem(
			`modrinth.user.${response.id}`,
			JSON.stringify(response),
		);
		localStorage.setItem(
			`modrinth.auth.${response.id}`,
			JSON.stringify({
				access_token: token.access_token,
				token_type: token.token_type,
				expires: addSeconds(new Date(), token.expires_in).toISOString(),
			}),
		);

		//return token.access_token;
		return {
			accessToken: "",
			account: {},
			authority: "",
			correlationId: "",
			expiresOn: new Date(),
			fromCache: false,
			idToken: "",
			
		};
	}
	public async acquireTokenSilent(
		silentRequest: SilentRequest,
	): Promise<string> {
		const account = silentRequest?.account
			? silentRequest.account
			: this.getActiveAccount();
		if (!account) {
			throw new Error("Failed to get user account");
		}

		const cache = localStorage.getItem(`modrinth.auth.${account.id}`);

		if (!cache)
			throw createBrowserAuthError(
				BrowserAuthErrorCodes.noTokenRequestCacheError,
			);

		const data = JSON.parse(cache) as CachedToken;

		if (compareAsc(new Date(), data.expires) === 1) {
			localStorage.removeItem(`modrinth.auth.${account.id}`);
			throw createBrowserAuthError(BrowserAuthErrorCodes.unableToLoadToken);
		}

		return data.access_token;
	}
	public getAccountById(localId: string): AccountInfo | null {
		try {
			const user = localStorage.getItem(`modrinth.user.${localId}`);
			return user ? (JSON.parse(user) as AccountInfo) : null;
		} catch (error) {
			auth.error(`Failed to get user by id: ${(error as Error)?.message}`);
			return null;
		}
	}
	public getAccountByUsername(userName: string): AccountInfo | null {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !key.startsWith("modrinth.user.")) continue;

			try {
				const value = localStorage.getItem(key);
				if (!value) continue;
				const item = JSON.parse(value) as AccountInfo;
				if (item.username === userName) return item;
			} catch (error) {
				auth.error(
					`Failed to parse user account info: ${(error as Error)?.message}`,
				);
			}
		}
		return null;
	}
	public getAllAccounts(): AccountInfo[] {
		const data = [];
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !key.startsWith("modrinth.user.")) continue;
			try {
				const value = localStorage.getItem(key);
				if (!value) continue;
				const item = JSON.parse(value) as AccountInfo;
				data.push(item);
			} catch (error) {
				auth.error(
					`Failed to parse user account info: ${(error as Error)?.message}`,
				);
			}
		}
		return data;
	}
	public loginPopup(
		request?: PopupRequest | undefined,
	): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	public logoutPopup(
		logoutRequest?: EndSessionPopupRequest | undefined,
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	public getTokenCache(): ITokenCache {
		throw new Error("Method not implemented.");
	}
	public setActiveAccount(account: AccountInfo | null): void {
		if (!account) return;
		localStorage.setItem("modrinth.active", account?.id);
	}
	public getActiveAccount(): AccountInfo | null {
		const active = localStorage.getItem("modrinth.active");
		if (!active) return null;

		try {
			return JSON.parse(active) as AccountInfo;
		} catch (error) {
			auth.error(`Failed to load active user: ${(error as Error)?.message}`);
			localStorage.removeItem("modrinth.active");
			return null;
		}
	}
	public hydrateCache(
		result: AuthenticationResult,
		request: PopupRequest | RedirectRequest | SilentRequest | SsoSilentRequest,
	): Promise<void> {
		throw new Error("Method not implemented.");
	}
	public clearCache(
		logoutRequest?: ClearCacheRequest | undefined,
	): Promise<void> {
		for (let i = 0; i < localStorage.length; i++) {
			const key = localStorage.key(i);
			if (!key || !key.startsWith("modrinth")) continue;
			localStorage.removeItem(key);
		}

		throw new Error("Method not implemented.");
	}
	private createPopupClient() {
		return new PopupClient();
	}*/
}
