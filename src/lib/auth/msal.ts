import { PublicClientApplication, EventType, type AuthenticationResult } from "@azure/msal-browser";
import localforage from 'localforage';

import "@lib/auth/msal_browser_override";
import { msalConfig } from '@lib/config/auth';

export const masl = new PublicClientApplication(msalConfig);

const accounts = masl.getAllAccounts();
if (accounts.length > 0) {
    masl.setActiveAccount(accounts[0]);
}

masl.addEventCallback((ev) => {
    switch (ev.eventType) {
        case EventType.LOGIN_SUCCESS: {
            if (!ev.payload) return;
            const payload = ev.payload as AuthenticationResult;
            const account = payload.account;
            masl.setActiveAccount(account);
            break;
        }
        case EventType.LOGOUT_SUCCESS: {
            localforage.clear();
        }
        default:
            break;
    }
});