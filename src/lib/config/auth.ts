import type { Configuration, PopupRequest, SilentRequest } from '@azure/msal-browser';

export const msalConfig = {
    auth: {
        clientId: import.meta.env.PUBLIC_VITE_CLIENT_ID,
        authority: `https://login.microsoftonline.com/consumers/`,
        redirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
        postLogoutRedirectUri: import.meta.env.PUBLIC_VITE_REDIRECT_URI,
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