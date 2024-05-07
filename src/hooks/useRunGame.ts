import { toast } from "react-toastify";
import { useCallback } from "react";

import type { MinecraftProfile } from "@lib/models/profiles";
import { asLaunchConfig } from "@system/launch_config";
import { queryClient } from "@lib/config/queryClient";
import { QUERY_KEY } from "@hook/useIsGameRunning";
import { startGame } from "@system/commands";
import profiles from "@lib/models/profiles";
import useDownload from "./useDownload";
import logger from "@system/logger";
import useUser from "./useUser";

const useRunGame = () => {
  const download = useDownload();
  const { refresh } = useUser();

  const run = useCallback(async (profile: MinecraftProfile) => {
    return new Promise<void>(async (ok, reject) => {
      let callback: ((ev: Event) => Promise<void>) | undefined = undefined;

      try {
        const user = await refresh();
        const config = await asLaunchConfig(user, profile);
        callback = async (ev: Event) => {
          const isValid = (ev as CustomEvent<{ vaild: boolean }>).detail.vaild;
          if (isValid) {
            await profiles.update({
              data: { lastUsed: new Date() },
              where: [{ id: profile.id }],
            });
            await startGame(config).catch(() => {
              window.dispatchEvent(
                new CustomEvent("mcl::game-exit-status", {
                  detail: { exitCode: 1, msg: "" },
                }),
              );
              reject();
            });
            await queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
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
