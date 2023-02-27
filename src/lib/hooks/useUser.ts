import { useMsal, useAccount } from "@azure/msal-react";
import { useQuery } from '@tanstack/react-query';
import { PublicClientApplication, InteractionType, InteractionStatus } from "@azure/msal-browser";
import { AuthCodeMSALBrowserAuthenticationProvider, AuthCodeMSALBrowserAuthenticationProviderOptions } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { Client } from "@microsoft/microsoft-graph-client";

import getMinecraft from '../auth/minecraft_login_flow';


interface Profile {
    photo: string;
    minecraft: Awaited<ReturnType<typeof getMinecraft>> | null;
    "@odata.context": string,
    "displayName": string,
    "surname": string,
    "givenName": string,
    "id": string,
    "userPrincipalName": string,
    "businessPhones": string[],
    "jobTitle": null | string,
    "mail": null | string,
    "mobilePhone": null | string,
    "officeLocation": null | string,
    "preferredLanguage": null | string
}


//https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master/minecraft_launcher_lib
//https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authorizationcoderequest
const useUser = () => {
    const account = useAccount();
    const { instance } = useMsal();
    const { data, isError, isLoading, error } = useQuery<Profile>(["user", account?.nativeAccountId], async () => {
        if (!account) throw new Error("No active account! Verify a user has been signed in and setActiveAccount has been called.");

        const options: AuthCodeMSALBrowserAuthenticationProviderOptions = {
            account, // the AccountInfo instance to acquire the token for.
            interactionType: InteractionType.Silent, // msal-browser InteractionType
            scopes: ["user.read"] // example of the scopes to be passed
        };
        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(instance as PublicClientApplication, options);
        const client = Client.initWithMiddleware({ authProvider });

        const data = await Promise.allSettled([
            client.api('/me').get(),
            client.api('/me/photo/$value').get().then(value => {
                if (!value) {
                    return `https://api.dicebear.com/5.x/initials/svg?seed=${account.username}`;
                }
                return URL.createObjectURL(value);
            }),
            getMinecraft(instance)
        ]);

        const userRaw = data.at(0);

        if (userRaw?.status === "rejected") throw new Error("Failed to load user profile");

        const user = userRaw?.value;
        user.photo = `https://api.dicebear.com/5.x/initials/svg?seed=${account.username}`;;
        user.minecraft = null;

        if (data[1].status === "fulfilled") {
            user.photo = data[1].value;
        }

        if (data[2].status === "fulfilled") {
            user.minecraft = data[2].value;
        }

        return user;
    }, { enabled: !!account, refetchInterval: false, refetchIntervalInBackground: false });

    return {
        user: data,
        isLoading,
        isError,
        error,
        account,
        instance
    }
}

export default useUser;