import { coerce } from "semver";
import { ParseID, SatisfiesMinecraftVersion } from "./ids";
import type{ Mod } from '../pages/store/Mods';
import type { Minecraft, Profile } from "../types";
import type { DownloadMod } from "./install";

export async function checkForModsUpdate(profile: Profile, mods_list: Mod[]) {
    const profile_info = ParseID(profile.lastVersionId);

    let update_list: DownloadMod[] = [];

    for(const mod of profile.mods) {
        const item = mods_list.find(i=>i.uuid===mod.id);
        if(!item) continue;

        const mc = Object.keys(item.download[profile_info.loader]).find(i=>SatisfiesMinecraftVersion(profile.lastVersionId,i as Minecraft));
        const download = item.download[profile_info.loader][mc as Minecraft];

        const new_version = coerce(download.version);
        const old_version = coerce(mod.version);
        if(!new_version || !old_version) continue;

        if((new_version.compare(old_version) === 1) || (new_version.compareBuild(old_version) === 1) || (new_version.comparePre(old_version) === 1)) {
            update_list.push({
                uuid: mod.id,
                name: mod.name,
                url: download.url,
                version: download.version,
                sha1: download.sha1
            });
            const index = profile.mods.findIndex(i=>i.id===mod.id);
            if(index === -1) throw new Error("Failed to update mod in profile.");
            profile.mods[index].version = download.version;
        }

    }

    return {
        profile,
        update_list
    }
}   