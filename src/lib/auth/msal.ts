import {
	PublicClientApplication,
	EventType,
	BrowserCacheLocation,
	type AuthenticationResult,
	type Configuration,
} from "@azure/msal-browser";
import { LogLevel } from "@azure/msal-common";
import { error, warn, info, debug, trace } from "@tauri-apps/plugin-log";

const configuration: Configuration = {
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
		allowPlatformBroker: true,
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
};

export const getPCA = () => {
	const pca = new PublicClientApplication(configuration);
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
	}

	return pca;
};
