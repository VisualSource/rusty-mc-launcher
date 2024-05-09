import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import { parseISO } from "date-fns/parseISO";
import { open } from "@tauri-apps/api/dialog";
import { toast } from "react-toastify";

import { CATEGORIES_KEY, CATEGORY_KEY } from "@hook/keys";
import { getDefaultMinecraftDirectory } from "./commands";
import { getLoaderType } from "@/utils/versionUtils";
import { queryClient } from "../config/queryClient";
//import categories from "../models/categories";
//import profiles from "../models/profiles";
import logger from "./logger";

const import_profiles = async () => {
  const dir = await getDefaultMinecraftDirectory();
  const result = await open({
    multiple: false,
    defaultPath: dir,
    title: "Import Profiles",
    filters: [
      {
        name: "Json",
        extensions: ["json"],
      },
    ],
  });

  if (!result || Array.isArray(result)) {
    toast.error("Failed to import profiles");
    return;
  }

  try {
    const content = await readTextFile(result, { dir: BaseDirectory.AppData });
    const file = JSON.parse(content) as {
      profiles: Record<
        string,
        {
          lastUsed: string;
          lastVersionId: string;
          created: string;
          icon: string;
          name: string;
          type: string;
          gameDir?: string;
          javaDir?: string;
          javaArgs?: string;
          logConfig?: string;
          logConfigIsXML?: boolean;
          resolution?: {
            width: number;
            height: number;
          };
        }
      >;
    };

    for (const [key, profile] of Object.entries(file.profiles)) {
      const loader = getLoaderType(profile.lastVersionId);
      const id = crypto.randomUUID();
      /* await profiles
         .create({
           data: {
             id,
             lastUsed: parseISO(profile.lastUsed),
             created: parseISO(profile.created),
             lastVersionId: profile.lastVersionId,
             name: profile.name.length ? profile.name : key,
             active: false,
             disable_chat: false,
             disable_mulitplayer: false,
             console: false,
             gameDir: null,
             icon: profile.icon.startsWith("data:image") ? profile.icon : null,
             javaArgs:
               profile.javaArgs ??
               "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
             javaDir: profile.javaDir ?? null,
             is_demo: false,
             logConfig: profile.logConfig ?? null,
             logConfigIsXML: profile.logConfigIsXML ?? false,
             loader: loader.type,
             mods: null,
             resolution: profile.resolution ?? null,
           },
         })
         .then(() => {
           return categories.create({
             data: {
               id: crypto.randomUUID(),
               name: null,
               group_id: 0,
               profile_id: id,
             },
           });
         });*/
    }

    queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
    queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY, 0] });
  } catch (error) {
    logger.error(error);
    toast.error("Import profile error!");
  }

  toast.success("Imported Profiles");
};

export default import_profiles;
