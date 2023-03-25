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

export interface ProfileFull extends Profile {
    photo: string;
    minecraft: MC | null;
}

const getMSAPhoto = async (account: AccountInfo, client: Client) => {
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

const getMSAProfile = async (account: AccountInfo, client: Client) => {
    const id = `${account.nativeAccountId ?? account.homeAccountId}-profile`;
    const data = await localforage.getItem<Profile | null>(id);

    if (!data) {
        const request = await client.api('/me').get();

        await localforage.setItem(id, request);

        return request;
    }

    return data;
}

const loadMinecraftProfile = async (account: AccountInfo | null, instance: IPublicClientApplication) => {
    if (!account) throw new Error("No user account selected to fetch minecraft profile.");
    const id = `${account.nativeAccountId ?? account.homeAccountId}-minecraft`;
    const data = await localforage.getItem<MC | null>(id);
    const fetchProfile = async () => {
        const profile = await getMinecraft(instance);
        localforage.setItem(id, profile);
        return profile;
    }

    if (!data) return fetchProfile();

    const token = JSON.parse(atob(data.token.access_token.split(".")[1])) as { exp: number; };

    if (new Date(token.exp * 1000) >= new Date()) {
        return fetchProfile();
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
            getMSAProfile(account, client),
            getMSAPhoto(account, client),
            loadMinecraftProfile(account, instance)
        ]);

        let user = profile.status === "fulfilled" ? profile.value : {};
        user.photo = photo.status === "fulfilled" ? photo.value : "";
        user.minecraft = minecraft.status === "fulfilled" ? minecraft.value : null;

        return user;
    }, { enabled: !!account, refetchInterval: false, refetchIntervalInBackground: false });

    return {
        minecraft: () => loadMinecraftProfile(account, instance),
        user: data,
        isLoading,
        isError,
        error,
        account,
        instance
    }
}

export default useUser;