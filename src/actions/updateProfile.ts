import type { ActionFunction } from "react-router-dom";
import { z } from 'zod';
import { UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import { MinecraftProfile } from "@/lib/models/profiles";
import { createProfile, db } from "@system/commands";
import { queryClient } from "@/lib/config/queryClient";
import { CATEGORY_KEY } from "@/hooks/keys";
import logger from "@lib/system/logger";

const updateProfile: ActionFunction = async ({ request }) => {
  const data = await request.json() as MinecraftProfile;

  switch (request.method.toUpperCase()) {
    case "POST": {

      try {
        const queue_id = crypto.randomUUID();
        await db.execute({
          query: `
          BEGIN TRANSACTION;
            INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
            INSERT INTO categories ('profile','category') VALUES (?,?);
            INSERT INTO download_queue VALUES (?,?,
              (SELECT COUNT(*) as count FROM download_queue WHERE state = 'PENDING'),
              ?,?,?,?,?,?,?);
          COMMIT;
        `, args: [
            data.id,
            data.name,
            data.icon ?? null,
            data.date_created,
            data.last_played ?? null,
            data.version,
            data.loader,
            data.loader_version ?? null,
            data.java_args ?? null,
            data.resolution_width ?? null,
            data.resolution_height ?? null,
            "INSTALLING",

            data.id,
            UNCATEGORIZEDP_GUID,

            queue_id,
            1,
            `Minecraft ${data.version} ${data.loader}`,
            null,
            data.id,
            (new Date()).toISOString(),
            "client",
            JSON.stringify({ game: data.version, loader: data.loader, loader_version: data.loader_version }),
            "PENDING"
          ]
        });
      } catch (error) {
        logger.error(error);
      }

      // Insert into db
      /*  await db.execute({
          query: "INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
          args: [
            data.id,
            data.name,
            data.icon ?? null,
            data.date_created,
            data.last_played ?? null,
            data.version,
            data.loader,
            data.loader_version ?? null,
            data.java_args ?? null,
            data.resolution_width ?? null,
            data.resolution_height ?? null,
            "INSTALLING"
          ]
        });
  
        // create system directory
        await createProfile(data.id);
  
        // add to Uncategorized GROUP
        await db.execute({
          query: "INSERT INTO categories ('profile','category') VALUES (?,?)",
          args: [data.id, UNCATEGORIZEDP_GUID]
        });
        // update query
        await queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID] });
  
        // queue download
  
        const result = await db.select({ query: "SELECT COUNT(*) as count FROM download_queue WHERE state = 'PENDING';", schema: z.object({ count: z.number() }) })
        const count = result.at(0)?.count;
  
        // add to download queue
        const queue_id = crypto.randomUUID();
        await db.execute({
          query: "INSERT INTO download_queue VALUES (?,?,?,?,?,?,?,?,?,?)", args: [
            queue_id,
            true,
            count,
            `Minecraft ${data.version} ${data.loader}${data.loader_version ? "-" + data.loader_version : ''} client`,
            null,
            data.id,
            (new Date()).toISOString(),
            "client",
            JSON.stringify({ game: data.version, loader: data.loader_version, loader_version: data.loader_version }),
            "PENDING"
          ]
        });*/

      break;
    }
    default:
      throw new Error("Unsupported action");
  }

  return new Response(null, {
    status: 302,
    headers: {
      Location: `/profile/${data.id}`,
    },
  });
};

export default updateProfile;
