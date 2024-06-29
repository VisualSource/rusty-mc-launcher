import {
	PublicClientApplication,
	EventType,
	type AuthenticationResult,
	type Configuration,
	LogLevel,
} from "@masl/index";
import { auth } from "@system/logger";

const configuration: Configuration = {
	auth: {
		clientId: import.meta.env.PUBLIC_VITE_CLIENT_ID,
		authority: "https://login.microsoftonline.com/consumers/",
		redirectUri: "http://localhost",
		postLogoutRedirectUri: "http://localhost",
	},
	cache: {
		temporaryCacheLocation: "sessionStorage",
		cacheLocation: "localStorage",
		cacheMigrationEnabled: true,
	},
	system: {
		allowNativeBroker: true,
		loggerOptions: {
			piiLoggingEnabled: false,
			logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
			loggerCallback(level: LogLevel, message: string) {
				switch (level) {
					case LogLevel.Error:
						auth.error(message);
						break;
					case LogLevel.Warning:
						auth.warn(message);
						break;
					case LogLevel.Info:
						auth.info(message);
						break;
					case LogLevel.Verbose:
						auth.verbose(message);
						break;
					case LogLevel.Trace:
						auth.trace(message);
						break;
				}
			},
		},
	},
};

export const getPCA = async () => {
	const pca =
		await PublicClientApplication.createPublicClientApplication(configuration);

	pca.addEventCallback((ev) => {
		switch (ev.eventType) {
			case EventType.LOGIN_SUCCESS: {
				if (!ev.payload) break;
				const account = (ev.payload as AuthenticationResult).account;
				pca.setActiveAccount(account);
				break;
			}
			case EventType.ACCOUNT_ADDED: {
				auth.debug("New Account Added");
				break;
			}
			case EventType.ACCOUNT_REMOVED: {
				auth.debug("Account has been removed");
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
