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
    authority: `https://login.microsoftonline.com/consumers/`,
    redirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
    postLogoutRedirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
  },
  system: {
    allowNativeBroker: true,
    loggerOptions: {
      logLevel: import.meta.env.DEV ? LogLevel.Verbose : LogLevel.Error,
      loggerCallback(level: LogLevel, message: string, containsPii: boolean) {
        if (containsPii) return;
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
            auth.debug(message);
            break;
          case LogLevel.Trace:
            auth.error(message);
            break;
        }
      },
    },
  },
};

export const getPCA = async () => {
  const pca = new PublicClientApplication(configuration);

  pca.addEventCallback((ev) => {
    switch (ev.eventType) {
      case EventType.LOGIN_SUCCESS: {
        if (!ev.payload) break;
        const account = (ev.payload as AuthenticationResult).account;
        pca.setActiveAccount(account);
        break;
      }
      case EventType.INITIALIZE_END: {
        if (pca.getActiveAccount()) break;

        const accounts = pca.getAllAccounts();
        const account = accounts.at(0);
        if (!account) break;

        pca.setActiveAccount(account);
        break;
      }
    }
  });

  return pca;
};
