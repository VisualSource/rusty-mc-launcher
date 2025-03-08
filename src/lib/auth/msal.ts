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

// public db format
// id          msName    msUsername   xuid   mcId 
// ID_TOKEN | ID_TOKEN | ID_TOKEN   | MC   | 

class CustomPublicClientApplication implements IPublicClientApplication {
	private initialized = false;
	private activeAccount: string | null = null;
	private accounts: AccountInfo[] = [];

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
		const result = new Promise((ok, reject) => {
			let onSuccess: Promise<UnlistenFn> | undefined = undefined;
			let onError: Promise<UnlistenFn> | undefined = undefined;
			const handleEvent = (ev: Event<unknown>) => {
				switch (ev.event) {
					case "rmcl-auth-login-error":
						reject(new Error(ev.payload as string));
						break;
					case "rmcl-auth-login-success":
						ok(ev.payload);
						break;
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
			scopes = scopes.concat(...request.extraScopesToConsent)
		}

		await authenticate(scopes);
		const data = await result;

		console.log(data);

		throw new Error("TODO: finish impl");
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
			this.activeAccount = null;
			return;
		}
		this.activeAccount = account?.homeAccountId;
	}
	public getActiveAccount(): AccountInfo | null {
		if (!this.activeAccount) return null;

		const account = this.accounts.find(e => e.homeAccountId === this.activeAccount);
		if (!account) return null;
		/*
		{
			environment: "spa",
			homeAccountId: "000-",
			localAccountId: "",
			tenantId: "",
			username: "Hello"
		}
		*/
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
	async hydrateCache(_result: AuthenticationResult, _request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void> {





	}
	async clearCache(_logoutRequest?: ClearCacheRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}

}

export const getPCA = () => {
	const client = new CustomPublicClientApplication();
	client.initialize().catch(e => console.error(e));
	return client;
};