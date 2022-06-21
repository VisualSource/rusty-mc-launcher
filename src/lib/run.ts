import { toast } from "react-toastify";
import DowloadMannager from './download';
import { RunMinecraft, CheckVersion } from './invoke';
import { MinecraftLaunchError } from './errors';
import type { User } from "../components/account/Account";
import type { Profile } from "../types";
import DB from "./db";

export default async function LaunchGame(profile: Profile | undefined, user: User):  Promise<void> {
    if(!user.active || !user.profile) throw new MinecraftLaunchError("Current user is not authorized.");
    if(!profile) throw new MinecraftLaunchError("Can't launch game without a profile!");

    const [installed,check_type] = await CheckVersion(profile.lastVersionId);

    if(!installed) {
        const dl = DowloadMannager.Get();
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

        
    const db = DB.Get();

    // update profile
    await db.profiles.update({ uuid: profile.uuid }, { lastUsed: new Date().toISOString(), mods: profile.mods });


    const lastPlayed = window.localStorage.getItem("last_profile");
    // switch mod folders
    // await SwitchModsFolder(lastPlayed, lastPlayed);

    // set mod folder
    window.localStorage.setItem("last_profile",profile.uuid);

    await toast.promise(RunMinecraft({ profile: user.profile, version: profile.lastVersionId }),{
        pending: "Launching Minecraft",
        error: "Failed to launch Minecraft",
        success: "Launched Minecraft"
    });
}