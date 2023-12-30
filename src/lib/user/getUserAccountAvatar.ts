import type { Client } from "@microsoft/microsoft-graph-client";
import { type AccountInfo } from "@azure/msal-browser";
import localforage from "localforage"

export const getUserAccountAvatar = async (account: AccountInfo, client: Client) => {
    const id = `${account.nativeAccountId ?? account.homeAccountId}-photo`;
    const data = await localforage.getItem<Blob | null>(id);

    if (!data) {
        const image = await client.api("/me/photo/$value").get();

        await localforage.setItem(id, image);

        return URL.createObjectURL(image);
    }

    if (data instanceof Blob) return URL.createObjectURL(data);

    return `https://api.dicebear.com/5.x/initials/svg?seed=${account.username}`;
};