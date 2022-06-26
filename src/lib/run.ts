import { toast } from "react-toastify";
import DowloadMannager from './download';
import { RunMinecraft, CheckVersion, SawpModsFolders, Log } from './invoke';
import { isModded } from "./ids";
import { GetModsList } from '../pages/store/Mods';
import { MinecraftLaunchError } from './errors';
import DB from "./db";
import { checkForModsUpdate } from './update';
import type { User } from "../components/account/Account";
import type { Profile } from "../types";

export default async function LaunchGame(profile: Profile | undefined, user: User):  Promise<void> {
    if(!user.active || !user.profile) throw new MinecraftLaunchError("Current user is not authorized.");
    if(!profile) throw new MinecraftLaunchError("Can't launch game without a profile!");

    const [installed,check_type] = await CheckVersion(profile.lastVersionId);
    const dl = DowloadMannager.Get();
    const db = DB.Get();

    if(!installed) {
        switch (check_type) {
            case "no_jar":
            case "no_manifest":
            case "no_root": {
                toast.info(`Installing ${profile.lastVersionId}`);
                const res = await dl.install({ type: "client", data: profile.lastVersionId });
                if(!res) toast.info("Need to wait for download queue to finish before launching the game.");
                break;
            }
            case "no_natives": {
                toast.info(`Installing Natives for ${profile.lastVersionId}`);
                const res = await dl.install({ type: "natives_install", data: profile.lastVersionId });
                if(!res) toast.info("Need to wait for download queue to finish before launching the game.");
                break;
            }
        }
    }

    // mod/modpack update check 
        // do update
    if(isModded(profile.lastVersionId)) {
        if(profile.isModpack) {
            
        } else {
            const mods_list = await GetModsList();
            const output = await checkForModsUpdate(profile,mods_list);

            await dl.install({ type: "update_mods", data: { profile: output.profile.uuid, mods: output.update_list } });

            await db.profiles.update({ uuid: output.profile.uuid }, { mods: output.profile.mods });
        }
    }

    await db.profiles.update({ uuid: profile.uuid }, { lastUsed: new Date().toISOString(), mods: profile.mods });
    
    if(isModded(profile.lastVersionId)) {
        Log("Swaping folders");
        await SawpModsFolders(profile.uuid);
    }
    // set mod folder
    window.localStorage.setItem("last_profile",profile.uuid);

    await toast.promise(RunMinecraft({ profile: user.profile, version: profile.lastVersionId }),{
        pending: "Launching Minecraft",
        error: "Failed to launch Minecraft",
        success: "Launched Minecraft"
    });
}