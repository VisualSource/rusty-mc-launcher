import { toast } from "react-toastify";
import { useCallback } from "react";

import { selectVersion } from "@/components/dialog/SelectVersion";
import { selectProfile } from "@/components/dialog/ProfileSelection";
import useDownload from "./useDownload"
import logger from "../system/logger";

const useInstallContent = () => {
    const { installMods, installPack } = useDownload();

    const installContent = useCallback(async (slug: string, type: "resourcepack" | "shader" | "mod" | "modpack", opts?: { minecraft_versions?: string[]; modloaders?: string[], modList?: string[] }) => {
        try {
            switch (type) {
                case 'resourcepack':
                    installPack(slug, "resource");
                    break;
                case 'shader':
                    installPack(slug, "shader");
                    break;
                case 'mod': {
                    if (!opts?.minecraft_versions || !opts.modloaders) break;
                    const version = await selectVersion({ minecraft_versions: opts.minecraft_versions, modloaders: opts.modloaders });
                    if (!version) break;
                    const profile = await selectProfile({ minecraft_versions: [version.game], modloaders: [version.loader] });
                    if (!profile) break;
                    installMods(profile, [slug]);
                    break;
                }
                case 'modpack':
                    throw new Error("Unable to install modpacks at this time.")
                default:
                    break;
            }
        } catch (error) {
            logger.error(error);
            toast.error("Failed to install content.", {
                data: {
                    time: new Date(),
                    event: "install",
                    id: slug,
                    type,
                }
            })
        }
    }, []);

    return installContent;
}

export default useInstallContent;