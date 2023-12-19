import { toast } from "react-toastify";
import type { MinecraftProfile } from "../models/profiles";
import { asLaunchConfig } from "../system/launch_config";
import { play } from "../system/commands";
import useDownload from "./useDownload";
import useUser from "./useUser";
import { useCallback } from "react";
import logger from "../system/logger";

const useRunGame = () => {
    const download = useDownload();
    const { minecraft } = useUser();

    const run = useCallback(async (profile: MinecraftProfile) => {
        try {
            const user = await minecraft(true);
            const config = await asLaunchConfig(user, profile);

            document.addEventListener("mcl::install_ready", async (ev) => {
                if ((ev as CustomEvent<{ vaild: boolean }>).detail.vaild) {
                    await play(config);
                }
            }, { once: true });

            await download.install(config.version, config.game_directory);
        } catch (error) {
            logger.error(error);
            toast.error("Failed to start the game!");
        }
    }, []);

    return { run };
}

export default useRunGame;