import { satisfies, coerce } from "semver";
import { ParseID } from "./ids";
import type { Mod } from "../pages/store/Mods";
import type { Profile } from "../types";


export interface DownloadMod { 
    name: string, 
    uuid: string, 
    url: string, 
    version: string 
}
interface AddToProfileList {
    download: DownloadMod[],
    profile: Profile
}


export function AddModToProfile(mod: Mod, profile: Profile, modsList: Mod[]): AddToProfileList  {
    const profile_info = ParseID(profile.lastVersionId);

    const mods = profile.mods;
    const inconpatable = mod.inconpatable
    const required = mod.required;

    if(mods.some(value=>value.id===mod.uuid)){
        throw new Error(`The mod ${mod.name} is already installed on profile ${profile.name}`);
    }

    // Run inconpatable check
    if(inconpatable){
        const inconpatable_mod_uuid = inconpatable[profile_info.loader].find(value=>{
            return mods.some(item=>item.id===value);
        });
        if(inconpatable_mod_uuid){
            const inconpate = modsList.find(item=>item.uuid === inconpatable_mod_uuid);
            if(!inconpate) throw new Error(`Can't install ${mod.name} do to missing inconpatable mod uuid.`);
            throw new Error(`Mod ${mod.name} is Inconpatable with ${inconpate?.name}`);
        }
    }

    let download_list: DownloadMod[] = [];

    const mc_verison = coerce(profile_info.minecraft);
    if(!mc_verison) throw new Error(`Failed to coerce minecraft version into a vaild format`);

    const version = Object.keys(mod.download[profile_info.loader]).find(value=>{
        let mod_mc = value;
        if(!mod_mc.includes("*")) {
            const v = coerce(value);
            if(!v) return false;
            mod_mc = v.version;        
        }
        return satisfies(mc_verison.version,mod_mc)
    });

    if(!version) throw new Error(`Failed to find supported minecraft version for ${mod.name}`);

    const download = mod.download[profile_info.loader][version];

    profile.mods.push({
        name: mod.name,
        version: download.version,
        icon: mod.icon,
        id: mod.uuid
    });
    
    download_list.push({ name: mod.name, uuid: mod.uuid, ...download });

    if(required) {
        required[profile_info.loader].forEach(value=>{
            if(profile.mods.some(i=>i.id === value)) return;

            const req = modsList.find(i=>i.uuid === value);

            if(!req) throw new Error(`Failed to find mod def for uuid(${value})`);

            const output = AddModToProfile(req,profile,modsList);

            profile = output.profile;

            download_list = download_list.concat(output.download);
        });
    }

    return {
        profile,
        download: download_list
    };
}