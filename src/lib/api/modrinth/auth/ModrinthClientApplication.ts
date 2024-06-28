import type {
	AccountInfo,
	AuthenticationResult as CommonAuthenticationResult,
} from "@azure/msal-common";
import type {
	AuthorizationCodeRequest,
	BrowserConfiguration,
	ClearCacheRequest,
	Configuration,
	EndSessionPopupRequest,
	EndSessionRequest,
	EventCallbackFunction,
	INavigationClient,
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
import { PopupClient } from "./PopupClient";
import { auth } from "@/lib/system/logger";
import { getUserFromAuth } from "../services.gen";
import { modrinthClient } from "../../modrinthClient";
import { addSeconds } from "date-fns/addSeconds";
import type { User } from "../types.gen";

export type AuthenticationResult = CommonAuthenticationResult & {
	account: User;
};
export class ModrinthClientApplication {
	public static async createPublicClientApplication(
		_configuration?: Configuration,
	): Promise<ModrinthClientApplication> {
		const pca = new ModrinthClientApplication();
		return pca;
	}

	initialize(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async acquireTokenPopup(_request: PopupRequest): Promise<AuthenticationResult> {
		const client = this.createPopupClient();
		const token = await client.acquireToken();

		const response = await getUserFromAuth({
			client: modrinthClient,
			headers: {
				"Authorization": token.access_token
			}
		});
		if (response.error) throw response.error;
		if (!response.data) throw new Error("Failed to fetch user data");

		return {
			tokenType: token.token_type,
			accessToken: token.access_token,
			account: response.data,
			authority: "modrinth",
			expiresOn: addSeconds(new Date(), token.expires_in),
			fromCache: false,
		} as AuthenticationResult;
	}
	acquireTokenRedirect(_request: RedirectRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	acquireTokenSilent(
		silentRequest: SilentRequest,
	): Promise<AuthenticationResult> {
		const account = silentRequest?.account
			? silentRequest.account as never
			: this.getActiveAccount();
		if (!account) {
			throw new Error("Failed to get user account");
		}

		const cache = localStorage.getItem(`modrinth.auth.${account.id}`);

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
	getActiveAccount(): User | null {
		const active = localStorage.getItem("modrinth.account");
		if (!active) return null;

		try {
			return JSON.parse(active) as User;
		} catch (error) {
			auth.error(`Failed to load active user: ${(error as Error)?.message}`);
			localStorage.removeItem("modrinth.account");
			return null;
		}
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
	private createPopupClient() {
		return new PopupClient();
	}
	/*
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

*/
}
