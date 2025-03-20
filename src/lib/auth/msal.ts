import type {
	IPublicClientApplication,
	AuthenticationResult,
	AccountInfo,
	AuthorizationCodeRequest,
	BrowserConfiguration,
	ClearCacheRequest,
	EndSessionPopupRequest,
	EndSessionRequest,
	EventCallbackFunction,
	INavigationClient,
	InitializeApplicationRequest,
	ITokenCache,
	PerformanceCallbackFunction,
	PopupRequest,
	RedirectRequest,
	SilentRequest,
	SsoSilentRequest,
	WrapperSKU,
	EventMessage,
	EventPayload,
	EventError,
} from "@azure/msal-browser";
import { error, warn, info, trace, debug } from "@tauri-apps/plugin-log";
import type { AccountFilter } from "@azure/msal-common";
import { InteractionType, Logger, LogLevel, EventType, BrowserAuthError } from "@azure/msal-browser";
import { authenticate, refresh } from "../api/plugins/auth";
import { query, transaction } from "../api/plugins/query";
import { message } from "@tauri-apps/plugin-dialog";
import { addSeconds } from "date-fns/addSeconds";
import { fetch } from "@tauri-apps/plugin-http";
import { Account, type Cape, type Skin } from "../models/account";
import { Token } from "../models/tokens";
import { nanoid } from "../nanoid";
import type {
	AuthenticationResult as CommonAuthenticationResult,
} from "@azure/msal-common/browser";

export type AuthenticationResultExtended = CommonAuthenticationResult & {
	account: Account,
	tokens: Token
};

const MINECRAFT_LOGIN =
	"https://api.minecraftservices.com/authentication/login_with_xbox";
const MINECRAFT_PROFILE = "https://api.minecraftservices.com/minecraft/profile";
const XBOX_AUTHENTICATE = "https://user.auth.xboxlive.com/user/authenticate";
const LIVE_AUTHENTICATE = "https://xsts.auth.xboxlive.com/xsts/authorize";
const MC_LOGIN_RELAY = "rp://api.minecraftservices.com/";
const XBOX_LIVE_RELAY = "http://auth.xboxlive.com";
const UNIX_EPOCH_DATE = new Date("1970-01-01T00:00:00Z");

class CustomPublicClientApplication implements IPublicClientApplication {
	private initialized = false;
	private activeAccount: string | null = null;
	private accounts: Account[] = [];
	private callbacks: Map<string, [EventCallbackFunction, Array<EventType> | undefined]> = new Map();

	private logger = new Logger({
		logLevel: LogLevel.Verbose,
		loggerCallback: (level, message) => {
			switch (level) {
				case LogLevel.Error:
					error(message);
					break;
				case LogLevel.Warning:
					warn(message);
					break;
				case LogLevel.Info:
					info(message);
					break;
				case LogLevel.Verbose:
					debug(message);
					break;
				case LogLevel.Trace:
					trace(message);
					break;
			}
		},
	}, "rmcl-auth", "0.0.0");
	public async initialize(_request?: InitializeApplicationRequest): Promise<void> {
		try {
			if (this.initialized) {
				this.logger.info("initialize has already been called, exiting early.");
				return;
			}
			this.emit(EventType.INITIALIZE_START);
			this.accounts = await query`SELECT * FROM accounts`.as(Account).all();
			this.activeAccount = localStorage.getItem("active-account");
			if (!this.activeAccount && this.accounts.length >= 1) {
				const account = this.accounts.at(0);
				if (account) this.setActiveAccount(account);
			}
			this.emit(EventType.INITIALIZE_END);
			this.initialized = true;
		} catch (error) {
			console.error(error);
		}
	}
	//#region acquireToken
	public async acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResultExtended> {
		const loggedInAccounts = this.getAllAccounts();
		try {
			this.emit(
				loggedInAccounts.length > 0 ?
					EventType.ACQUIRE_TOKEN_START :
					EventType.LOGIN_START,
				InteractionType.Popup,
				request
			);

			const data = await this.createPopupClient(request.scopes);
			const minecraft = await this.minecraftLogin(data.accessToken);

			const result = await this.generateAuthenticationResult(data, minecraft);

			if (!this.activeAccount) this.setActiveAccount(result.account);

			const isLoggingIn = loggedInAccounts.length < this.getAllAccounts().length;
			this.emit(isLoggingIn ?
				EventType.LOGIN_SUCCESS :
				EventType.ACQUIRE_TOKEN_SUCCESS,
				InteractionType.Popup,
				result
			);
			return result;
		} catch (error) {
			this.emit(loggedInAccounts.length > 0 ?
				EventType.ACQUIRE_TOKEN_FAILURE
				: EventType.LOGIN_FAILURE,
				InteractionType.Popup,
				null,
				error as Error
			);

			throw error;
		}
	}
	async acquireTokenRedirect(_request: RedirectRequest): Promise<void> {
		throw new Error("Use 'acquireTokenPopup' or 'acquireTokenSilent'");
	}
	public async acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResultExtended> {
		const account = (silentRequest.account as Account | undefined) ?? this.getActiveAccount();
		if (!account) throw new BrowserAuthError("no_account_error");
		try {
			this.emit(EventType.ACQUIRE_TOKEN_START, InteractionType.Silent, silentRequest);

			let fromCache = true;
			const token = await query`SELECT * FROM tokens WHERE id = ${account.homeAccountId}`.as(Token).get();
			if (!token) throw new BrowserAuthError("no_token_request_cache_error");

			if (token.isAccessTokenExpired()) {
				fromCache = false;
				const result = await refresh(token.refreshToken);
				token
					.setAccessToken(result.access_token)
					.setAccessTokenExpires(result.expires_in)
					.setRefreshToken(result.refresh_token);
				await query`UPDATE tokens SET accessToken = ${token.accessToken}, refreshToken = ${token.refreshToken}, accessTokenExp = ${token.accessTokenExp?.toISOString() ?? null} WHERE id = ${token.id}`.run();
			}

			if (token.isMcAccessTokenExpired()) {
				fromCache = false;
				const result = await this.minecraftAuthenicate(token.accessToken);
				token.setMcData(result.accessToken, result.expDate);
				await query`UPDATE tokens SET mcAccessToken = ${token.mcAccessToken ?? null}, mcAccessTokenExp = ${token.mcAccessTokenExp ?? null} WHERE id = ${token.id}`.run();
			}

			const result = {
				tokens: token,
				idToken: "",
				idTokenClaims: account.idTokenClaims ?? {},
				scopes: [],
				tenantId: account.idTokenClaims?.aud ?? "",
				tokenType: "Barrer",
				uniqueId: "",
				correlationId: "",
				authority: "MSA",
				accessToken: token.accessToken,
				expiresOn: token.accessTokenExp ?? new Date(),
				fromCache,
				account,
			} satisfies AuthenticationResultExtended;

			this.emit(EventType.ACQUIRE_TOKEN_SUCCESS, InteractionType.Silent, result);

			return result;
		} catch (error) {
			console.log(error);
			this.emit(EventType.ACQUIRE_TOKEN_FAILURE, InteractionType.Silent, null, error as Error);
			throw error;
		}
	}
	async acquireTokenByCode(_request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
		throw new Error("Use 'acquireTokenPopup' or 'acquireTokenSilent'");
	}
	//#endregion acquireToken

	//#region callbacks
	public addEventCallback(callback: EventCallbackFunction, eventTypes?: Array<EventType>): string | null {
		const id = nanoid();
		this.callbacks.set(id, [callback, eventTypes]);
		return id;
	}
	public removeEventCallback(callbackId: string): void {
		this.callbacks.delete(callbackId);
	}
	addPerformanceCallback(_callback: PerformanceCallbackFunction): string {
		throw new Error("Method not supported.");
	}
	removePerformanceCallback(_callbackId: string): boolean {
		throw new Error("Method not supported.");
	}
	//#endregion callbacks

	//#region storage
	enableAccountStorageEvents(): void {
		throw new Error("Method not supported.");
	}
	disableAccountStorageEvents(): void {
		throw new Error("Method not supported.");
	}
	//#endregion storage

	//#region account
	public getAccountByHomeId(homeAccountId: string): Account | null {
		return this.accounts.find(e => e.homeAccountId === homeAccountId) ?? null;
	}
	public getAccountByLocalId(_localId: string): Account | null {
		throw new Error("Use 'getAccountByHomeId'");
	}
	public getAccountByUsername(userName: string): Account | null {
		const account = this.accounts.find(e => e.username === userName);
		return account ?? null;
	}
	public getAllAccounts(): Account[] {
		return this.accounts;
	}
	public setActiveAccount(account: Account | null): void {
		if (!account) {
			localStorage.removeItem("active-account");
			this.activeAccount = null;
			return;
		}
		this.activeAccount = account.homeAccountId;
		localStorage.setItem("active-account", this.activeAccount);
	}
	public getActiveAccount(): Account | null {
		if (!this.activeAccount) return null;

		const account = this.accounts.find(e => e.homeAccountId === this.activeAccount);
		if (!account) return null;
		return account;
	}
	public getAccount(filter: AccountFilter): Account | null {
		const id = filter.homeAccountId;
		if (!id) return null;

		return this.accounts.find(e => e.homeAccountId === id) ?? null;
	}
	//#endregion account

	//#region login
	async loginPopup(request?: PopupRequest): Promise<AuthenticationResultExtended> {
		return this.acquireTokenPopup(request ?? {
			scopes: []
		});
	}
	async loginRedirect(_request?: RedirectRequest): Promise<void> {
		throw new Error("use 'loginPopup'");
	}
	async logout(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("Use 'logoutPopup'");
	}
	//#endregion login

	//#region logout
	async logoutRedirect(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("use 'logoutRedirect'");
	}
	async logoutPopup(logoutRequest?: EndSessionPopupRequest): Promise<void> {
		try {
			this.emit(EventType.LOGOUT_START, InteractionType.Popup, null);

			const active = this.getActiveAccount()?.homeAccountId;
			const current = logoutRequest?.account?.homeAccountId ?? active
			if (!current) throw new Error("No to account to logout");

			const idx = this.accounts.findIndex(e => e.homeAccountId === current);
			if (idx === -1) throw new Error("Failed to find account in cache");
			if (current === active) {
				this.setActiveAccount(null);
			}
			this.accounts.splice(idx, 1);
			await query`DELETE FROM accounts WHERE homeAccountId = ${current}`.run();
			this.emit(EventType.LOGOUT_END, InteractionType.Popup, null);
		} catch (error) {
			this.emit(EventType.LOGOUT_FAILURE, InteractionType.Popup, null, error as Error);
			this.emit(EventType.LOGOUT_END, InteractionType.Popup, null);
			throw error;
		}
	}
	//#endregion logout

	//#region cache
	getTokenCache(): ITokenCache {
		throw new Error("Method not supported.");
	}
	async hydrateCache(_result: AuthenticationResult, _request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void> { }
	async clearCache(_logoutRequest?: ClearCacheRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	//#endregion cache
	public async handleRedirectPromise(_hash?: string): Promise<AuthenticationResult | null> {
		if (!this.initialized) {
			throw new BrowserAuthError("uninitialized_public_client_application")
		}
		return null;
	}
	public getLogger(): Logger {
		return this.logger;
	}
	public setLogger(_logger: Logger): void {
		throw new Error("Method not supported.");
	}
	public async ssoSilent(_request: SsoSilentRequest): Promise<AuthenticationResult> { throw new Error("Method not implemented."); }
	public initializeWrapperLibrary(_sku: WrapperSKU, _version: string): void { }
	public setNavigationClient(_navigationClient: INavigationClient): void {
		throw new Error("Method not supported");
	}
	public getConfiguration(): BrowserConfiguration {
		throw new Error("Method not supported.");
	}
	//#region helpers
	private emit(eventType: EventType, interactionType?: InteractionType, payload?: EventPayload, error?: EventError) {
		const message = {
			eventType,
			interactionType: interactionType ?? null,
			payload: payload ?? null,
			error: error ?? null,
			timestamp: Date.now(),
		} satisfies EventMessage
		for (const [callback, types] of this.callbacks.values()) {
			if (types?.length !== 0 && !types?.includes(eventType)) continue;
			callback(message);
		}
	}
	private async generateAuthenticationResult(microsoft: Awaited<ReturnType<CustomPublicClientApplication["createPopupClient"]>>, minecraft: Awaited<ReturnType<CustomPublicClientApplication["minecraftLogin"]>>): Promise<AuthenticationResultExtended> {
		const claims = microsoft.claims;
		if (!claims || !claims.sub || !claims.preferred_username || !claims.aud) throw new Error("Missing id_token claims");

		const tokens = new Token({
			id: claims.sub,
			accessToken: microsoft.accessToken,
			refreshToken: microsoft.refreshToken,
			accessTokenExp: microsoft.expires,
			mcAccessToken: minecraft.accessToken,
			mcAccessTokenExp: minecraft.expDate
		});

		let found = true;
		let user = this.accounts.find(e => e.homeAccountId === claims.sub);
		if (!user) {
			found = false;
			user = new Account({
				idTokenClaims: microsoft.claims,
				authorityType: "MSA",
				environment: "browser",
				homeAccountId: claims.sub,
				username: claims?.preferred_username,
				name: minecraft.profile.name,
				id: minecraft.profile.id,
				profileActions: minecraft.profile.profileActions,
				skins: minecraft.profile.skins,
				capes: minecraft.profile.capes ?? [],
				idToken: microsoft.idToken,
				localAccountId: "",
				tenantId: claims.aud,
				xuid: minecraft.xuid,
			});

			await transaction((tx) => {
				tx`DELETE FROM accounts WHERE homeAccountId = ${claims.sub}`;
				(user as Account).runAsQuery(tx);
				tokens.runAsQuery(tx);
			});
			this.accounts.push(user);
		} else {
			await query`UPDATE tokens SET 
				accessToken = ${tokens.accessToken}, 
				refreshToken = ${tokens.refreshToken},
				accessTokenExp = ${tokens.accessTokenExp?.toISOString() ?? null},
				mcAccessToken = ${tokens.mcAccessToken ?? null},
				mcAccessTokenExp = ${tokens.mcAccessTokenExp?.toISOString() ?? null} WHERE id = ${claims.sub}`.run();
		}

		return {
			tokens: tokens,
			accessToken: minecraft.accessToken,
			account: user,
			authority: "MSA",
			uniqueId: "",
			tokenType: microsoft.tokenType,
			scopes: microsoft.scopes,
			idTokenClaims: claims,
			idToken: microsoft.idToken,
			tenantId: claims.aud,
			fromCache: false,
			expiresOn: minecraft.expDate,
			correlationId: ""
		} satisfies AuthenticationResultExtended;
	}
	private async createPopupClient(scopes: string[]): Promise<{
		claims: AccountInfo["idTokenClaims"],
		expires: Date,
		accessToken: string;
		refreshToken: string;
		tokenType: string,
		idToken: string,
		scopes: string[]
	}> {

		const response = await authenticate(scopes);

		const expires = addSeconds(new Date(), response.expires_in - 1);
		const jwtPayload = response.id_token.split(".").at(1);
		if (!jwtPayload) throw new Error("Missing id_token payload");
		const claims = JSON.parse(atob(jwtPayload)) as AccountInfo["idTokenClaims"];

		return {
			idToken: response.id_token,
			scopes: response.scope.split(" "),
			tokenType: response.token_type,
			claims,
			expires,
			accessToken: response.access_token,
			refreshToken: response.refresh_token
		};
	}
	//#endregion helpers

	//#region minecraft
	private async minecraftLogin(accessToken: string) {
		const response = await this.minecraftAuthenicate(accessToken);
		const profile = await this.getMinecraftProfile(response.accessToken);

		return { ...response, profile }
	}
	/**
	 * Get minecraft profile
	 * @param accessToken minecraft access token
	 * @returns 
	 */
	private async getMinecraftProfile(accessToken: string) {
		//#region Get Minecraft Profile
		const profileResponse = await fetch(MINECRAFT_PROFILE, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
			},
		});
		if (!profileResponse.ok)
			throw new Error(profileResponse.statusText, { cause: profileResponse });
		const profile = (await profileResponse.json()) as
			| {
				capes?: Cape[];
				id: string;
				name: string;
				skins: Skin[];
				profileActions: Record<string, unknown>;
			}
			| { path: string; error: string; errorMessage: string };

		if ("error" in profile) {
			await message(
				"Current Microsoft account does not have a minecraft account",
				{ title: "Minecraft Login", kind: "error" },
			);
			throw new Error("Current account does not have a minecraft account!");
		}
		//#endregion

		return profile;
	}
	/**
	 * @see https://wiki.vg/Microsoft_Authentication_Scheme
	 * @param accessToken microsoft access token
	 * @returns 
	 */
	private async minecraftAuthenicate(accessToken: string) {
		// #region Authenticate with Xbox Live.
		const authResponse = await fetch(XBOX_AUTHENTICATE, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				Properties: {
					AuthMethod: "RPS",
					SiteName: "user.auth.xboxlive.com",
					RpsTicket: `d=${accessToken}`,
				},
				RelyingParty: XBOX_LIVE_RELAY,
				TokenType: "JWT",
			}),
		});

		if (!authResponse.ok) throw new Error(authResponse.statusText, { cause: authResponse });
		const authRequest = (await authResponse.json()) as {
			Token: string;
			DisplayClaims: { xui: { uhs: string }[] };
		};

		const userHash = authRequest.DisplayClaims.xui.at(0)?.uhs;
		if (!userHash) throw new Error("Failed to get user hash");
		const xboxToken = authRequest.Token;
		// #endregion

		// #region Authenticate with XSTS
		const liveResponse = await fetch(LIVE_AUTHENTICATE, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				Properties: {
					SandboxId: "RETAIL",
					UserTokens: [xboxToken],
				},
				RelyingParty: MC_LOGIN_RELAY,
				TokenType: "JWT",
			}),
		});

		if (!liveResponse.ok)
			throw new Error(liveResponse.statusText, { cause: liveResponse });
		const liveToken = await liveResponse
			.json()
			.then((e) => (e as { Token: string }).Token);
		// #endregion

		// #region Authenticate with minecraft
		const mclResponse = await fetch(MINECRAFT_LOGIN, {
			method: "POST",
			body: JSON.stringify({
				identityToken: `XBL3.0 x=${userHash};${liveToken}`,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		});
		if (!mclResponse.ok)
			throw new Error(mclResponse.statusText, { cause: mclResponse });
		const access_token = await mclResponse
			.json()
			.then((e) => (e as { access_token: string }).access_token);

		const jwt = JSON.parse(atob(access_token.split(".")[1])) as {
			xuid: string;
			exp: number;
		};
		const expDate = addSeconds(UNIX_EPOCH_DATE, jwt.exp);
		// #endregion

		return { xuid: jwt.xuid, expDate, accessToken: access_token }
	}

	//#endregion minecraft
}

export const getPCA = () => {
	const client = new CustomPublicClientApplication();
	return client;
};