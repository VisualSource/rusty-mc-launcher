import { BaseDirectory, readTextFile } from "@tauri-apps/api/fs";
import { dataDir, join } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";
import { toast } from "react-toastify";
import { CATEGORY_KEY, KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { UNCATEGORIZEDP_GUID } from "../models/categories";
import type { MinecraftProfile } from "../models/profiles";
import { queryClient } from "../config/queryClient";
import { QueueItemState } from "../QueueItemState";
import { type Loader, db } from "./commands";
import logger from "./logger";

const get_version = (
  lastVersionId: string,
): [string, Loader, string | null] => {
  if (lastVersionId.includes("forge")) {
    const [version, _, loader_version] = lastVersionId.split("-");
    return [version, "forge", loader_version];
  } else if (lastVersionId.includes("fabric")) {
    const [_, _1, loader_version, version] = lastVersionId.split("-");
    return [version, "fabric", loader_version];
  } else if (lastVersionId.includes("quilt")) {
    const [_, _1, loader_version, version] = lastVersionId.split("-");
    return [version, "quilt", loader_version];
  } else {
    return [lastVersionId, "vanilla", null];
  }
};

const import_profiles = async () => {
  const datadir = await dataDir();
  const minecraft_dir = await join(datadir, ".minecraft");

  const result = await open({
    multiple: false,
    defaultPath: minecraft_dir,
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
    const data = JSON.parse(content) as {
      profiles: Record<
        string,
        {
          lastUsed: string;
          lastVersionId: string;
          created: string;
          icon: string;
          name: string;
          type: string;
        }
      >;
    };
    const latest_data = (await fetch(
      "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
    ).then((e) => e.json())) as {
      latest: { release: string; snapshot: string };
    };
    const profiles: MinecraftProfile[] = [];

    for (const [_key, profile] of Object.entries(data.profiles)) {
      let [version, loader, loader_version] = get_version(
        profile.lastVersionId,
      );

      if (["latest-release", "latest-snapshot"].includes(version)) {
        version =
          latest_data.latest[
            version.replace(
              "latest-",
              "",
            ) as keyof (typeof latest_data)["latest"]
          ];
      }

      const id = crypto.randomUUID();
      profiles.push({
        name: profile.name.length
          ? profile.name
          : `${loader}${loader != "vanilla" ? `(${loader_version})` : ""} ${version}`,
        icon: profile.icon.length ? profile.icon : null,
        id,
        java_args:
          "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
        loader,
        last_played: profile.lastUsed ?? new Date().toISOString(),
        state: "UNINSTALLED",
        version,
        loader_version,
        date_created: profile?.created ?? new Date().toISOString(),
        resolution_height: null,
        resolution_width: null,
      });
    }

    await db.execute({
      query: `INSERT INTO profiles ('id','name','icon','date_created','last_played','version','loader','loader_version','java_args','resolution_width','resolution_height','state') VALUES ${Array.from(
        { length: profiles.length },
      )
        .fill(0)
        .map((e) => "(?,?,?,?,?,?,?,?,?,?,?,?)")
        .join(", ")};`,
      args: profiles
        .map((e) => [
          e.id,
          e.name,
          e.icon,
          e.date_created,
          e.last_played,
          e.version,
          e.loader,
          e.loader_version,
          e.java_args,
          e.resolution_width,
          e.resolution_width,
          e.state,
        ])
        .flat(),
    });

    await queryClient.invalidateQueries({
      queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID],
    });

    await db.execute({
      query: `INSERT INTO download_queue VALUES ${Array.from({
        length: profiles.length,
      })
        .fill(0)
        .map((_) => "(?,?,?,?,?,?,?,?,?,?)")
        .join(", ")};`,
      args: profiles
        .map((e) => [
          crypto.randomUUID(),
          1,
          0,
          e.name,
          e.icon,
          e.id,
          new Date().toISOString(),
          "Client",
          JSON.stringify({
            version: e.version,
            loader: e.loader.replace(/^\w/, e.loader[0].toUpperCase()),
            loader_version: e.loader_version,
          }),
          "PENDING",
        ])
        .flat(),
    });

    await queryClient.invalidateQueries({
      queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
    });

    toast.success("Imported Profiles");
  } catch (error) {
    logger.error(error);
    toast.error("Import profile error!", {
      data: { error: (error as Error).message },
    });
  }
};

export default import_profiles;
