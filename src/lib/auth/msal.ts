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

class CustomPublicClientApplication implements IPublicClientApplication {
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
	async initialize(_request?: InitializeApplicationRequest): Promise<void> {
		// init db stuff
	}
	async acquireTokenPopup(_request: PopupRequest): Promise<AuthenticationResult> {
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
		console.debug(callback, eventTypes);
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
			let onDestoryed: Promise<UnlistenFn> | undefined = undefined;

			const handleEvent = (ev: Event<unknown>) => {
				switch (ev.event) {
					case "rmcl-auth-login-error":
						reject(ev.payload);
						break;
					case "rmcl-auth-login-window-destroyed":
						reject(new Error("Login window was closed"));
						break;
					case "rmcl-auth-login-success":
						ok(ev.payload);
						break;
					default:
						reject(new Error(`Unknown event "${ev.event}"`, { cause: ev }));
						break;
				}
				Promise.all([onSuccess, onError, onDestoryed]).then(e => {
					for (const unsub of e) unsub?.call(this);
				}).catch(e => console.error(e));
			}

			onError = once("rmcl-auth-login-error", handleEvent);
			onSuccess = once("rmcl-auth-login-success", handleEvent);
			onDestoryed = once("rmcl-auth-login-window-destroyed", handleEvent);
		});

		await authenticate(request?.scopes ?? []);
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
	getLogger(): Logger {
		return this.logger;
	}
	setLogger(_logger: Logger): void {
		throw new Error("Method not supported.");
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
		throw new Error("Method not supported");
	}
	getConfiguration(): BrowserConfiguration {
		throw new Error("Method not supported.");
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
	const client = new CustomPublicClientApplication();
	client.initialize().catch(e => console.error(e));
	return client;
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