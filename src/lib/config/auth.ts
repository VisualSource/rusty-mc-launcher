import { LogLevel, type Configuration, type PopupRequest, type SilentRequest } from '@azure/msal-browser';
import logger from '../system/logger';

export const msalConfig = {
    auth: {
        clientId: import.meta.env.PUBLIC_VITE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/consumers/`,
        redirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
        postLogoutRedirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                switch (level) {
                    case LogLevel.Error:
                        logger.error(message);
                        break;
                    case LogLevel.Info:
                        logger.info(message);
                        break;
                    case LogLevel.Warning:
                        logger.warn(message);
                        break;
                    case LogLevel.Verbose:
                    case LogLevel.Trace:
                        logger.debug(message);
                        break;
                    default:
                        logger.log(message);
                        break;
                }
            },
            logLevel: LogLevel.Error
        }
    },
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
    }
} satisfies Configuration;

export const loginRequest = {
    scopes: ["User.Read"],
    extraScopesToConsent: ["XboxLive.SignIn", "XboxLive.offline_access"]
} satisfies PopupRequest;

export const xboxRequest = {
    scopes: ["XboxLive.SignIn", "XboxLive.offline_access"],
    extraQueryParameters: {
        "response_type": "code"
    }
} satisfies SilentRequest;