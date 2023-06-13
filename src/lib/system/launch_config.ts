import localforage from "localforage";
import type { ProfileFull } from "@hook/useUser";
import { MinecraftProfile } from "@lib/models/profiles";
import { getLoaderType } from "@/utils/versionUtils";

type PathBuf = string;
export interface LaunchConfig {
    profile_id?: string;
    launcher_name?: string,
    laucher_version?: string,
    classpath?: string,
    assets?: string,
    version_type?: string,
    console: boolean,
    classpath_separator?: string,
    game_directory?: PathBuf,
    version: string,
    token: string,
    uuid: string,
    xuid: string,
    username: string,
    executable_path?: PathBuf,
    jvm_args?: string[],
    use_custom_resolution: boolean,
    is_demo: boolean,
    resolution_width?: number,
    resolution_height?: number,
    server?: string,
    port?: string,
    natives_directory?: PathBuf,
    enable_logging_config: boolean,
    disable_mulitplayer: boolean,
    disable_chat: boolean,
    forge?: string,
    fabric?: string,
    client_id?: string,
}

type LastestVersions = { latest: { release: string; snapshot: string; } };

const fetchLastet = async () => {
    const request = await fetch("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json").then(value => value.json()) as LastestVersions;

    let exp = new Date();
    exp.setDate(exp.getDate() + 5);
    return localforage.setItem<LastestVersions["latest"] & { exp: Date }>("latest-release", { ...request.latest, exp });
};

export const asLaunchConfig = async (user: ProfileFull | undefined, profile: MinecraftProfile | null | undefined): Promise<LaunchConfig> => {
    if (!user || !user?.minecraft || !profile) throw new Error("Missing user profile");

    let lastVersionId = profile.lastVersionId;

    if (["latest-release", "latest-snapshot"].includes(profile.lastVersionId)) {
        const latest = await localforage.getItem<{ release: string; snapshot: string, exp: Date }>("latest-release");

        if (!latest || (latest.exp <= new Date())) {
            const request = await fetchLastet();
            lastVersionId = request[profile.lastVersionId.replace("latest-", "") as "release" | "snapshot"]
        } else {
            lastVersionId = latest[profile.lastVersionId.replace("latest-", "") as "release" | "snapshot"]
        }
    }

    const { type, loader } = getLoaderType(lastVersionId);

    const data: LaunchConfig = {
        profile_id: profile.id,
        console: profile.console,
        version: lastVersionId,
        token: user.minecraft.token.access_token,
        uuid: user.minecraft.profile.id,
        xuid: user.minecraft.xuid,
        username: user.minecraft.profile.name,
        client_id: import.meta.env.PUBLIC_VITE_CLIENT_ID,
        use_custom_resolution: !!profile?.resolution,
        is_demo: false,
        enable_logging_config: !!profile?.logConfigIsXML,
        disable_mulitplayer: profile.disable_mulitplayer,
        disable_chat: profile.disable_chat,
    };

    if (type === "fabric") {
        data.fabric = loader;
    }

    if (type === "forge") {
        data.forge = loader;
    }

    if (profile?.resolution) {
        data["resolution_height"] = profile.resolution.height;
        data["resolution_width"] = profile.resolution.width;
    }

    return data;
}