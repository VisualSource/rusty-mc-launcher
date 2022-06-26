import { satisfies, coerce } from "semver";
import { GetLoaderVersions } from './invoke';
import { ParseID, StringifyID } from "./ids";
import { GetModsList, Mod } from "../pages/store/Mods";
import type { Minecraft, Profile } from "../types";
import type { ModPack } from "../pages/store/Modpacks";
import { nanoid } from "nanoid";
import DB from "./db";
import DownloadManger from "./download";


export interface DownloadMod { 
    name: string, 
    uuid: string, 
    url: string, 
    version: string,
    sha1: string;
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

    const download = mod.download[profile_info.loader][version as Minecraft];

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


export async function CreateModpack(pack: ModPack): Promise<void> {
    const minecraft = pack.minecraft[0];
    const loader = pack.loaders[0];

    const loader_versions = await GetLoaderVersions(loader,minecraft);
    const mod_list = await GetModsList();

    const latest = loader_versions.at(0);

    if(!latest) throw new Error("Failed to get latest loader version");


    const lastVersionId = StringifyID(minecraft,loader,latest,[]);

    let created = new Date().toISOString();

    let downloads: DownloadMod[] = [];

    let profile: Profile = {
        isModpack: true,
        name: pack.name,
        uuid: nanoid(),
        lastVersionId,
        type: "custom",
        created,
        lastUsed: created,
        category: "MODPACK",
        banner: "/images/VanillaBanner.webp",//pack.banner,
        icon: pack.icon,// pack.icon,
        card: "/images/VanillaCard.webp",//pack.card,
        mods: []    
    };


    for(const mod of pack.mods) {
        const data = mod_list.find(i=>i.uuid===mod);
        if(!data) continue;
        const output = AddModToProfile(data,profile,mod_list);
        downloads = downloads.concat(output.download);
        profile = output.profile;
    }


    const db = DB.Get();
    const dl = DownloadManger.Get();

    await db.profiles.insert(profile);

    await dl.install({ type: "install_mods", data: { profile: profile.uuid, mods: downloads } });
}