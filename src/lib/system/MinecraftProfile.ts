import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import localforage from "localforage";
import type { ProfileFull } from "@hook/useUser";

type PathBuf = string;

export interface LaunchConfig {
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

export interface MinecraftProfile {
    id: string;
    console: boolean;
    is_demo: boolean;
    disable_mulitplayer: boolean,
    disable_chat: boolean,
    name: string;
    created: string;
    lastUsed: string;
    icon: string;
    lastVersionId: string;
    gameDir?: string;
    javaDir?: string;
    javaArgs?: string[];
    logConfig?: string;
    logConfigIsXML?: boolean;
    resolution?: {
        height: number;
        width: number;
    }
}

type LastestVersions = { latest: { release: string; snapshot: string; } };
type ProfileSet = Set<MinecraftProfile>;

const KEY = "minecraft-profiles";
const ACTIVE_KEY = "active-profile";

export const useMinecraftProfiles = () => {
    const queryClient = useQueryClient()
    const { data, isError, isLoading, error } = useQuery([KEY], async () => {
        const profiles = await localforage.getItem<ProfileSet>(KEY);
        return profiles ?? new Set();
    });
    const mutation = useMutation<ProfileSet, Error, { type: "delete" | "patch" | "create", data: MinecraftProfile }, {}>(async ev => {
        const profiles = (await localforage.getItem<ProfileSet>(KEY)) ?? new Set();
        switch (ev.type) {
            case "create": {
                profiles.add(ev.data);
                return localforage.setItem(KEY, profiles);
            }
            case "delete": {
                profiles.delete(ev.data);
                return localforage.setItem(KEY, profiles);
            }
            case "patch": {
                const og = Object.values(profiles).find(value => value.id === ev.data.id);
                if (!og) throw new Error("Failed to find profile!");
                profiles.delete(og);
                profiles.add(ev.data);
                return localforage.setItem(KEY, profiles);
            }
            default:
                throw new Error("Bad method request");
        }
    },
        {
            onSuccess: async data => {
                await queryClient.cancelQueries([KEY]);
                queryClient.setQueryData([KEY], data);
            }
        }
    );
    const selected = useQuery([ACTIVE_KEY], async () => {
        const selected = await localforage.getItem<MinecraftProfile>(ACTIVE_KEY);
        return selected;
    });
    const mutateSelected = useMutation<MinecraftProfile | null, Error, MinecraftProfile | null>(async ev => {
        return localforage.setItem<MinecraftProfile | null>(ACTIVE_KEY, ev);
    }, {
        onSuccess: async data => {
            await queryClient.cancelQueries([ACTIVE_KEY]);
            queryClient.setQueryData([ACTIVE_KEY], data);
        }
    });

    return {
        selected,
        mutateSelected,
        mutate: mutation,
        profiles: data,
        isError,
        isLoading,
        error
    };
}

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

    const data: LaunchConfig = {
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

    if (profile?.resolution) {
        data["resolution_height"] = profile.resolution.height;
        data["resolution_width"] = profile.resolution.width;
    }

    return data;
}