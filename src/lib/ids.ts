import { Loader, Minecraft, VersionId, OptifineVersionId, FabricVersionId, ForgeVersionId } from "../types";


export function StringifyID(minecraft: string | null, loader: string | null, loader_v: string | null, mc: Minecraft[]): VersionId {
    let v = minecraft;
    if(minecraft === "latest-release") v = mc[0];
    
    switch (loader) {
        case "fabric":
            return `fabric-loader-${loader_v}-${v}` as FabricVersionId;
        case "forge":
            return `${v}-forge-${loader_v}` as ForgeVersionId;
        case "optifine":
            return `${v}-OptiFine_${loader_v}` as OptifineVersionId;
        default:
            return v as Minecraft;
    }
}

/**
 * Parse a minecraft profile lastVersion Id into its parts
 * 1. Minecraft version
 * 2. Mod Loader
 * 3. Mod Loader version
 * @param lastVersionId 
 * @returns 
 */
export function ParseID(lastVersionId: VersionId): { minecraft: Minecraft, loader: Loader, loader_version: string | null } {

    let minecraft: Minecraft = lastVersionId as Minecraft;
    let modloader: Loader = "vanilla";
    let version: string | null = null;

    if(lastVersionId.includes("forge")){
        const reg = lastVersionId.match(/(?<mc>\d.\d+(.\d+)?)-forge-(?<loader>\d+.\d+.\d+)/);
        if(!reg || !reg.groups) throw new Error("Failed to match");
        modloader = "forge";
        minecraft = reg.groups.mc as Minecraft;
        version = reg.groups.loader;
    } else if(lastVersionId.includes("fabric")) {
        const reg = lastVersionId.match(/fabric-loader-(?<loader>\d+.\d+.\d+)-(?<mc>\d+.\d+(.\d+)?)/)
        if(!reg || !reg.groups) throw new Error("Failed to match");
        modloader = "fabric";
        minecraft = reg.groups.mc as Minecraft;
        version = reg.groups.loader;
    } else if(lastVersionId.includes("OptiFine")){
        const reg = lastVersionId.match(/(?<mc>\d+.\d+(.\d+)?)-OptiFine_(?<loader>\w+_\w_\w\d+(_pre)?)/)
        if(!reg || !reg.groups) throw new Error("Failed to match");
        modloader = "optifine";
        minecraft = reg.groups.mc as Minecraft;
        version = reg.groups.loader;
    } 

    return {
        minecraft,
        loader: modloader,
        loader_version: version
    };
}