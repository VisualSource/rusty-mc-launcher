import { readFile } from "@tauri-apps/plugin-fs";
import { fetch } from "@tauri-apps/plugin-http";
import { sep } from "@tauri-apps/api/path";
import type { Cape, Skin } from "@/lib/models/account";

type ApiResponse = {
    id: string;
    name: string;
    activeSkinId: string;
    activeCapeId?: string;
    skins: Skin[]
    capes: Cape[]
}

type ApiErrorResponse = {
    path: string;
    errorType: string;
    error: string;
    errorMessage?: string;
    developerMessage?: string;
}

const MINECRAFT_API_CAPE =
    "https://api.minecraftservices.com/minecraft/profile/capes/active";
const MINECRAFT_API_SKIN =
    "https://api.minecraftservices.com/minecraft/profile/skins";

/** Test if the url is a path to a tauri file reference */
export const isUpload = (url: string): boolean => {
    const u = new URL(url);
    return u.hostname === "asset.localhost" || u.protocol === "asset"
};

/**
 * Set the minecraft skin
 * @link https://mojang-api-docs.gapple.pw/needs-auth/change-skin
 * @param skin 
 * @param accessToken 
 * @returns 
 */
export const uploadSkin = async (skin: { url: string; variant: Skin["variant"] }, accessToken: string) => {
    let payload: FormData | string;
    const headers = new Headers({
        Authorization: `Bearer ${accessToken}`,
    });

    if (isUpload(skin.url)) {
        const formData = new FormData();
        formData.append("variant", skin.variant.toLowerCase());

        const filePath = decodeURIComponent(skin.url)
            .replace("https://asset.localhost/", "")
            .replace("http://asset.localhost/", "")
            .replace("asset://", "");

        const filename = filePath.split(sep()).at(-1) ?? "player.png";
        const fileContent = await readFile(filePath);
        formData.append(
            "file",
            new File([fileContent], filename, { type: "image/png" })
        );

        payload = formData;
    } else {
        headers.set("Content-Type", "application/json");
        payload = JSON.stringify({
            url: skin.url,
            variant: skin.variant,
        });
    }

    const response = await fetch(MINECRAFT_API_SKIN, {
        method: "POST",
        headers,
        body: payload
    });

    if (!response.ok) {
        const data = await response.json() as ApiErrorResponse;
        console.error(data, response);
        throw new Error("Failed to set minecraft skin", {
            cause: response.statusText
        });
    }

    const data = await response.json() as
        | ApiResponse | ApiErrorResponse;
    if ("error" in data) {
        throw new Error(`Failed to set minecraft skin: ${data.errorMessage ?? data.error}`, { cause: data });
    }

    return data;
}


/**
 * Enable and set / disable minecraft cape
 * @link https://mojang-api-docs.gapple.pw/needs-auth/change-cape
 * @line https://mojang-api-docs.gapple.pw/needs-auth/disable-cape
 * @param accessToken 
 * @param cape 
 */
export const setCape = async (accessToken: string, capeId?: string) => {
    const method = capeId ? "PUT" : "DELETE";

    const headers = new Headers({
        Authorization: `Bearer ${accessToken}`,
    });

    if (capeId) headers.set("Content-Type", "application/json");

    const payload = capeId ? JSON.stringify({ capeId }) : undefined;

    const response = await fetch(MINECRAFT_API_CAPE, {
        method,
        headers,
        body: payload
    });

    if (!response.ok) throw new Error("Failed to update cape", { cause: response.statusText });

    const data = (await response.json()) as
        | ApiResponse
        | ApiErrorResponse;
    if ("error" in data) throw new Error(`There was an error setting the cape: ${data.errorMessage ?? data.error}`, { cause: data });
    return data;
}