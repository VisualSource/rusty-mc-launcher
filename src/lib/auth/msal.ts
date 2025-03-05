import type {
	IPublicClientApplication,
	EventType,
	BrowserCacheLocation,
	AuthenticationResult,
	Configuration,
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
import { Logger } from "@azure/msal-browser";
import type { AccountFilter, LogLevel } from "@azure/msal-common";
import { error, warn, info, debug, trace } from "@tauri-apps/plugin-log";
import { authenticate } from "../api/plugins/auth";
import { Event, once, UnlistenFn } from "@tauri-apps/api/event";

class CustomPublicClientApplication implements IPublicClientApplication {
	private logger = new Logger({}, "rmcl-auth", "0.0.0");
	async initialize(request?: InitializeApplicationRequest): Promise<void> {
		console.debug(request);
	}
	async acquireTokenPopup(_request: PopupRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	acquireTokenRedirect(_request: RedirectRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async acquireTokenSilent(_silentRequest: SilentRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	async acquireTokenByCode(_request: AuthorizationCodeRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	addEventCallback(callback: EventCallbackFunction, eventTypes?: Array<EventType>): string | null {
		console.debug(callback, eventTypes);
		return null;
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
		return [];
	}
	async handleRedirectPromise(_hash?: string): Promise<AuthenticationResult | null> {
		throw new Error("Method not implemented.");
	}
	async loginPopup(request?: PopupRequest): Promise<AuthenticationResult> {
		const result = new Promise((ok, reject) => {
			let onSuccess: Promise<UnlistenFn> | undefined = undefined;
			let onError: Promise<UnlistenFn> | undefined = undefined;

			const handleEvent = (ev: Event<unknown>) => {
				console.log(ev);
				switch (ev.event) {
					case "login-error":
						reject(ev.payload);
						break;
					case "login-success":
						ok(ev.payload);
						break;
					default:
						break;
				}
				Promise.all([onSuccess, onError]).then(e => e.map(sub => sub?.call(undefined))).catch(e => console.error(e));
			}

			onError = once("login-error", handleEvent);
			onSuccess = once("login-success", handleEvent);
		});

		await authenticate(request?.scopes ?? []);
		const data = await result;

		console.log(data);

		throw new Error("TODO: finish impl");
	}
	async loginRedirect(_request?: RedirectRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async logout(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async logoutRedirect(_logoutRequest?: EndSessionRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async logoutPopup(_logoutRequest?: EndSessionPopupRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async ssoSilent(_request: SsoSilentRequest): Promise<AuthenticationResult> {
		throw new Error("Method not implemented.");
	}
	getTokenCache(): ITokenCache {
		throw new Error("Method not implemented.");
	}
	getLogger(): Logger {
		return this.logger;
	}
	setLogger(_logger: Logger): void {
		throw new Error("Method not implemented.");
	}
	setActiveAccount(_account: AccountInfo | null): void {
		throw new Error("Method not implemented.");
	}
	getActiveAccount(): AccountInfo | null {
		return null;
	}
	getAccount(_filter: AccountFilter): AccountInfo | null {
		return null;
	}
	initializeWrapperLibrary(sku: WrapperSKU, version: string): void {
		console.debug(sku, version);
	}
	setNavigationClient(_navigationClient: INavigationClient): void {
		throw new Error("Method not implemented.");
	}
	getConfiguration(): BrowserConfiguration {
		throw new Error("Method not implemented.");
	}
	async hydrateCache(_result: AuthenticationResult, _request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}
	async clearCache(_logoutRequest?: ClearCacheRequest): Promise<void> {
		throw new Error("Method not implemented.");
	}

}

/*const configuration: Configuration = {
	auth: {
		clientId: import.meta.env.VITE_CLIENT_ID,
		authority: "https://login.microsoftonline.com/consumers/",
		redirectUri: "http://localhost",
		postLogoutRedirectUri: "http://localhost",
	},
	cache: {
		temporaryCacheLocation: BrowserCacheLocation.SessionStorage,
		cacheLocation: BrowserCacheLocation.LocalStorage,
		cacheMigrationEnabled: true,

	},
	system: {
		allowNativeBroker: true,
		loggerOptions: {
			piiLoggingEnabled: false,
			logLevel: LogLevel.Error, // import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
			loggerCallback(level: LogLevel, message: string) {
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
		},
	},
};*/

export const getPCA = () => {
	return new CustomPublicClientApplication();
	/*const pca = new PublicClientApplication(configuration);
	pca.initialize();
	pca.addEventCallback((ev) => {
		switch (ev.eventType) {
			case EventType.LOGIN_SUCCESS: {
				if (!ev.payload) break;
				const account = (ev.payload as AuthenticationResult).account;
				pca.setActiveAccount(account);
				break;
			}
			case EventType.ACCOUNT_ADDED: {
				debug("New Account Added");
				break;
			}
			case EventType.ACCOUNT_REMOVED: {
				debug("Account has been removed");
				break;
			}
		}
	});

	if (!pca.getActiveAccount()) {
		const accounts = pca.getAllAccounts();
		const account = accounts.at(0);
		if (account) {
			pca.setActiveAccount(account);
		}
	}*/

	//return pca;
};