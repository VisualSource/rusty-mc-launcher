export type Loader = "vanilla" | "fabric" | "forge" | "optifine";
export type Minecraft = `${number}.${number}.${number}` | `${number}.${number}`;

export type OptifineVersionId = `${Minecraft}-OptiFine_${string}_${string}_${string}${number}`;
export type ForgeVersionId = `${Minecraft}-forge-${number}.${number}.${number}`;
export type FabricVersionId = `fabric-loader-${number}.${number}.${number}-${Minecraft}`;
export type VersionId = Minecraft | FabricVersionId | ForgeVersionId | OptifineVersionId;

export interface Account {
    xuid: string;
    refresh_token: string;
    access_token: string;
    profile: {
        id: string;
        name: string;
        skins: {
            id: string;
            state: string;
            url: string;
            varient?: string;
            alias?: string
        }[]
        capes: {
            id: string;
            state: string;
            url: string;
            varient?: string;
            alias?: string
        }[]
    }
}

export interface Profile {
    isModpack: boolean;
    uuid: string;
    mods: {
        version: string;
        id: string;
        name: string;
        icon: string;
    }[],
    category: string;
    created: string;
    icon: string;
    card: string;
    banner: string;
    javaArgs?: string;
    javaDir?: string;
    gameDir?: string;
    logConfigIsXML?: boolean;
    logConfig?: string;
    lastUsed: string;
    lastVersionId: VersionId;
    name: string;
    resolution?: {
        width: number;
        height: number;
    }
    type: "custom" | "latest-release" | "latest-snapshot"
}

export interface InstallManifest {
    cache_install: boolean,
    cache_cli: boolean,
    cache_mods: boolean,
    minecraft: Minecraft,
    modloader_version: string | null,
    modloader: Loader,
    mods: Array<string>
}