import type {
	IPublicClientApplication,
	EventType,
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
} from "@azure/msal-browser";
import { type Event, once, type UnlistenFn } from "@tauri-apps/api/event";
import { error, warn, info, trace, debug } from "@tauri-apps/plugin-log";
import type { AccountFilter } from "@azure/msal-common";
import { Logger, LogLevel } from "@azure/msal-browser";
import { authenticate } from "../api/plugins/auth";
import { query, transaction } from "../api/plugins/query";
import { message } from "@tauri-apps/plugin-dialog";
import { addSeconds } from "date-fns/addSeconds";
import { fetch } from "@tauri-apps/plugin-http";
import { Account, type Cape, type Skin } from "../models/account";
import { Token } from "../models/tokens";

type LoginResponse = {
	access_token: string;
	expires_in: number;
	id_token: string;
	refresh_token: string;
	scope: string;
	token_type: string;
}

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
		if (this.initialized) return;
		this.initialized = true;

		this.activeAccount = localStorage.getItem("active-account");

		this.accounts = await query`SELECT * FROM accounts`.as(Account).all();

		if (this.activeAccount) {
			const account = this.accounts.find(e => e.homeAccountId === this.activeAccount);
			if (account) {



			}
		}




		// load accounts from db 
		// store in cache

		// check for active account

		// fetch auth tokens for active user
		// refresh active user token if needed
	}
	public async acquireTokenPopup(_request: PopupRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	acquireTokenRedirect(_request: RedirectRequest): Promise<void> {
		throw new Error("Use 'acquireTokenPopup' or 'acquireTokenSilent'");
	}
	async acquireTokenSilent(_silentRequest: SilentRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	async acquireTokenByCode(_request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
		throw new Error("Use 'acquireTokenPopup' or 'acquireTokenSilent'");
	}
	addEventCallback(callback: EventCallbackFunction, eventTypes?: Array<EventType>): string | null {
		return null;
	}
	removeEventCallback(_callbackId: string): void {
		throw new Error("Method not supported.");
	}
	addPerformanceCallback(_callback: PerformanceCallbackFunction): string {
		throw new Error("Method not supported.");
	}
	removePerformanceCallback(_callbackId: string): boolean {
		throw new Error("Method not supported.");
	}
	enableAccountStorageEvents(): void {
		throw new Error("Method not supported.");
	}
	disableAccountStorageEvents(): void {
		throw new Error("Method not supported.");
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
	public getAllAccounts(): AccountInfo[] {
		return this.accounts;
	}
	async handleRedirectPromise(_hash?: string): Promise<AuthenticationResult | null> {
		return null;
	}
	async loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
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
					for (const unsub of e) unsub?.call(this);
				}).catch(e => console.error(e));
			}

			onError = once("rmcl-auth-login-error", handleEvent);
			onSuccess = once("rmcl-auth-login-success", handleEvent);
		});

		let scopes = (request?.scopes ?? []);
		if (request?.extraScopesToConsent?.length) {
			scopes = scopes.concat(...request.extraScopesToConsent);
		}

		await authenticate(scopes);
		const response = await result
		const mcAuth = await this.minecraftAuthenicate(response.access_token);
		const mcProfile = await this.getMinecraftProfile(mcAuth.accessToken);

		const msTokenExp = addSeconds(new Date(), response.expires_in - 1);
		const jwtPayload = response.id_token.split(".").at(0);
		if (!jwtPayload) throw new Error("Missing id_token payload");
		const claims = JSON.parse(btoa(jwtPayload)) as { aio: string; aud: string; sub: string; preferred_username: string; };

		await transaction((tx) => {
			tx`DELETE FROM accounts WHERE homeAccountId = ${claims.sub}`;
			tx`INSERT INTO accounts VALUES (${claims.sub},${claims.preferred_username},${JSON.stringify(claims)},${mcProfile.name},${mcAuth.xuid},${mcProfile.id},${JSON.stringify(mcProfile.skins)},${JSON.stringify(mcProfile.capes ?? [])},${JSON.stringify(mcProfile.profileActions)});`;
			tx`INSERT INTO tokens VALUES (${claims.sub},${response.access_token},${response.refresh_token},${msTokenExp.toISOString()},${mcAuth.accessToken},${mcAuth.expDate.toISOString()});`;
		});

		const account = new Account({
			authorityType: "MSA",
			environment: "browser",
			username: claims.preferred_username,
			idTokenClaims: claims,
			idToken: response.id_token,
			name: mcProfile.name,
			id: mcProfile.id,
			capes: mcProfile.capes ?? [],
			skins: mcProfile.skins,
			xuid: mcAuth.xuid,
			homeAccountId: claims.sub,
			localAccountId: "",
			tenantId: claims.aud,
			profileActions: mcProfile.profileActions
		});

		this.accounts.push(account);

		return {
			accessToken: response.access_token,
			account: account,
			authority: "MSA",
			uniqueId: claims.aio,
			tokenType: response.token_type,
			scopes: response.scope.split(" "),
			idTokenClaims: claims,
			idToken: response.id_token,
			tenantId: claims.aud,
			fromCache: false,
			expiresOn: msTokenExp,
			correlationId: ""
		} as AuthenticationResult

		//throw new Error("TODO: finish impl");
	}
	async loginRedirect(_request?: RedirectRequest): Promise<void> {
		throw new Error("use 'loginPopup'");
	}
	async logout(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("Use 'logoutPopup'");
	}
	async logoutRedirect(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("use 'logoutRedirect'");
	}
	async logoutPopup(_logoutRequest?: EndSessionPopupRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async ssoSilent(_request: SsoSilentRequest): Promise<AuthenticationResult> { throw new Error("Method not implemented."); }
	getTokenCache(): ITokenCache {
		throw new Error("Method not supported.");
	}
	public getLogger(): Logger {
		return this.logger;
	}
	setLogger(_logger: Logger): void {
		throw new Error("Method not supported.");
	}
	public setActiveAccount(account: AccountInfo | null): void {
		if (!account) {
			localStorage.removeItem("active-account");
			this.activeAccount = null;
			return;
		}
		this.activeAccount = account?.homeAccountId;
		localStorage.setItem("active-account", this.activeAccount);
	}
	public getActiveAccount(): AccountInfo | null {
		if (!this.activeAccount) return null;

		const account = this.accounts.find(e => e.homeAccountId === this.activeAccount);
		if (!account) return null;
		return account;
	}
	getAccount(_filter: AccountFilter): AccountInfo | null {
		return null;
	}
	initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
		console.debug(sku, version);
	}
	setNavigationClient(_navigationClient: INavigationClient): void {
		throw new Error("Method not supported");
	}
	getConfiguration(): BrowserConfiguration {
		throw new Error("Method not supported.");
	}
	async hydrateCache(_result: AuthenticationResult, _request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void> { }
	async clearCache(_logoutRequest?: ClearCacheRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}

	/**
	 * Get minecraft profile
	 * @param accessToken minecraft access token
	 * @returns 
	 */
	async getMinecraftProfile(accessToken: string) {
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
	async minecraftAuthenicate(accessToken: string) {
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
		if (!authResponse.ok)
			throw new Error(authResponse.statusText, { cause: authResponse });
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
}

export const getPCA = () => {
	const client = new CustomPublicClientApplication();
	return client;
};