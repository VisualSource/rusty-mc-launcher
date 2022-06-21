import type { Loader, Minecraft, VersionId, OptifineVersionId, FabricVersionId, ForgeVersionId } from "../types";
import { satisfies, coerce } from "semver";
import { FabricIcon, ForgeIcon, OptiFineIcon } from "./images";

/**
 * Returns the default icon for a give loader version.
 *
 * @export
 * @param {VersionId} lastVersionId
 * @return {*}  {string}
 */
export function GetLoaderCard(lastVersionId: VersionId): string {
    const id = ParseID(lastVersionId);
    switch(id.loader) {
        case "fabric":
            return "/images/FabricCard.webp";
        case "forge":
            return "/images/ForgeCard.webp";
        case "optifine":
            return "/images/OptiFineCard.webp";
        case "vanilla":
            return "/images/VanillaCard.webp";
    }
}

/**
 * Gets the default banner icon for a given loader
 *
 * @export
 * @param {VersionId} lastVersionId
 * @return {*}  {string}
 */
export function GetLoaderBanner(lastVersionId: VersionId): string {
    const id = ParseID(lastVersionId);
    switch(id.loader) {
        case "fabric":
            return "/images/FabricBanner.webp";
        case "forge":
            return "/images/ForgeBanner.webp";
        case "optifine":
            return "/images/OptiFineBanner.webp";
        case "vanilla":
            return "/images/VanillaBanner.webp";
    }
}

/**
 * Gets a give loader default icon
 *
 * @export
 * @param {VersionId} lastVersionId
 * @return {*}  {string}
 */
export function GetLoaderIcon(lastVersionId: VersionId): string {
    const id = ParseID(lastVersionId);
    switch(id.loader) {
        case "fabric":
            return FabricIcon;
        case "forge":
            return ForgeIcon;
        case "optifine":
            return OptiFineIcon;
        case "vanilla":
            return "/images/Vanilla.webp";
    }
}

/**
 * takes the minecraft version, loader, and loader version and combines them into a single string 
 * as used in the offical launcher. Ext 1.18.2-forge-0.11.1
 * @export
 * @param {(string | null)} minecraft
 * @param {(string | null)} loader
 * @param {(string | null)} loader_v
 * @param {Minecraft[]} mc
 * @return {*}  {VersionId}
 */
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

export function SatisfiesMinecraftVersion(lastVersionId: VersionId, version: Minecraft): boolean {
    const { minecraft } = ParseID(lastVersionId);

    let range = version;
    if(!version.includes("*")) {
        const fixed_range = coerce(version);
        if(!fixed_range) throw new Error("Failed to coerce version");
        range = fixed_range.version as Minecraft;
    }

    const fixed_mc = coerce(minecraft);
    if(!fixed_mc) throw new Error("Failed to coerce version");

    return satisfies(fixed_mc.version,range);
}


/**
 * SHA-1 string hashing
 *
 * @export
 * @param {string} str
 * @return {*}  {number}
 */
export function StringHash(str: string): number {
    let hash = 0;

    if(str.length === 0) return hash;

    for(const i of str) {
        const char = i.charCodeAt(0);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }

    return hash;
}