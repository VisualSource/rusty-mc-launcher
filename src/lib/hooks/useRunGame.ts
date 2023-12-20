import { toast } from "react-toastify";
import { useCallback } from "react";

import type { MinecraftProfile } from "../models/profiles";
import { asLaunchConfig } from "../system/launch_config";
import { play } from "../system/commands";
import useDownload from "./useDownload";
import logger from "../system/logger";
import useUser from "./useUser";
import profiles from "../models/profiles";

const useRunGame = () => {
    const download = useDownload();
    const { minecraft } = useUser();

    const run = useCallback(async (profile: MinecraftProfile) => {
        try {
            const user = await minecraft(true);
            const config = await asLaunchConfig(user, profile);

            document.addEventListener("mcl::install_ready", async (ev) => {
                if ((ev as CustomEvent<{ vaild: boolean }>).detail.vaild) {
                    await profiles.update({ data: { lastUsed: new Date() }, where: [{ id: profile.id }] });
                    await play(config);
                }
            }, { once: true });

            await download.install(config.version, config.game_directory);
        } catch (error) {
            logger.error(error);
            toast.error("Failed to start the game!", { data: { time: new Date() } });
        }
    }, []);

    return { run };
}

export default useRunGame;