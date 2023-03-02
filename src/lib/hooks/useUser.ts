import { AuthCodeMSALBrowserAuthenticationProvider, type AuthCodeMSALBrowserAuthenticationProviderOptions } from "@microsoft/microsoft-graph-client/authProviders/authCodeMsalBrowser";
import { PublicClientApplication, InteractionType, type AccountInfo, IPublicClientApplication } from "@azure/msal-browser";
import { Client } from "@microsoft/microsoft-graph-client";
import { useMsal, useAccount } from "@azure/msal-react";
import { useQuery } from '@tanstack/react-query';
import localforage from "localforage";

import getMinecraft from '../auth/minecraft_login_flow';

type MC = Awaited<ReturnType<typeof getMinecraft>>;

interface Profile {
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

interface ProfileFull extends Profile {
    photo: string;
    minecraft: MC | null;
}

const getPhoto = async (account: AccountInfo, client: Client) => {
    const id = `${account.nativeAccountId ?? account.homeAccountId}-photo`;
    const data = await localforage.getItem<Blob | null>(id);

    if (!data) {
        const image = await client.api('/me/photo/$value').get();

        await localforage.setItem(id, image);

        return URL.createObjectURL(image);
    }

    if (data instanceof Blob) return URL.createObjectURL(data);

    return `https://api.dicebear.com/5.x/initials/svg?seed=${account.username}`
}

const getProfile = async (account: AccountInfo, client: Client) => {
    const id = `${account.nativeAccountId ?? account.homeAccountId}-profile`;
    const data = await localforage.getItem<Profile | null>(id);

    if (!data) {
        const request = await client.api('/me').get();

        await localforage.setItem(id, request);

        return request;
    }

    return data;
}

const loadMinecraft = async (account: AccountInfo, instance: IPublicClientApplication) => {
    const id = `${account.nativeAccountId ?? account.homeAccountId}-minecraft`;
    const data = await localforage.getItem<MC | null>(id);

    if (!data) {
        const profile = await getMinecraft(instance);

        localforage.setItem(id, profile);

        return profile;
    }

    return data;
}



//https://codeberg.org/JakobDev/minecraft-launcher-lib/src/branch/master/minecraft_launcher_lib
//https://azuread.github.io/microsoft-authentication-library-for-js/ref/modules/_azure_msal_browser.html#authorizationcoderequest
const useUser = () => {
    const account = useAccount();
    const { instance } = useMsal();
    const { data, isError, isLoading, error } = useQuery<ProfileFull>(["user", account?.nativeAccountId], async () => {
        if (!account) throw new Error("No active account! Verify a user has been signed in and setActiveAccount has been called.");

        const options: AuthCodeMSALBrowserAuthenticationProviderOptions = {
            account, // the AccountInfo instance to acquire the token for.
            interactionType: InteractionType.Silent, // msal-browser InteractionType
            scopes: ["user.read"] // example of the scopes to be passed
        };
        const authProvider = new AuthCodeMSALBrowserAuthenticationProvider(instance as PublicClientApplication, options);
        const client = Client.initWithMiddleware({ authProvider });

        const [profile, photo, minecraft] = await Promise.allSettled([
            getProfile(account, client),
            getPhoto(account, client),
            loadMinecraft(account, instance)
        ]);

        let user = profile.status === "fulfilled" ? profile.value : {};
        user.photo = photo.status === "fulfilled" ? photo.value : "";
        user.minecraft = minecraft.status === "fulfilled" ? minecraft.value : null;

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