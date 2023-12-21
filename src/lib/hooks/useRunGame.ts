import { toast } from "react-toastify";
import { useCallback } from "react";

import type { MinecraftProfile } from "../models/profiles";
import { asLaunchConfig } from "../system/launch_config";
import { play } from "../system/commands";
import profiles from "../models/profiles";
import useDownload from "./useDownload";
import logger from "../system/logger";
import useUser from "./useUser";

const useRunGame = () => {
  const download = useDownload();
  const { minecraft } = useUser();

  const run = useCallback(async (profile: MinecraftProfile) => {
    return new Promise<void>(async (ok, reject) => {
      let callback: ((ev: Event) => Promise<void>) | undefined = undefined;

      try {
        const user = await minecraft(true);
        const config = await asLaunchConfig(user, profile);
        callback = async (ev: Event) => {
          const isValid = (ev as CustomEvent<{ vaild: boolean }>).detail.vaild;
          if (isValid) {
            await profiles.update({
              data: { lastUsed: new Date() },
              where: [{ id: profile.id }],
            });
            await play(config);
            return ok();
          }
          reject();
        };

        window.addEventListener("mcl::install_ready", callback, { once: true });
        await download.install(config.version, config.game_directory);
      } catch (error) {
        logger.error(error);
        toast.error("Failed to start the game!", {
          data: { event: "game-start", type: "failed" },
        });
        if (callback)
          window.removeEventListener("mcl::install_ready", callback);
        reject();
      }
    });
  }, []);

  return run;
};

export default useRunGame;
