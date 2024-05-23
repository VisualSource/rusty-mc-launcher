import type { ActionFunction } from "react-router-dom";
import { MinecraftProfile } from "@/lib/models/profiles";
import { db } from "@system/commands";
import { UNCATEGORIZEDP_GUID } from "@/lib/models/categories";

const updateProfile: ActionFunction = async ({ request }) => {
  const data = await request.json() as MinecraftProfile;

  switch (request.method.toUpperCase()) {
    case "POST": {

      await db.execute({
        query: "INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?)",
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
          data.resolution_height ?? null
        ]
      });

      await db.execute({
        query: "INSERT INTO categories ('profile','category') VALUES (?,?)",
        args: [data.id, UNCATEGORIZEDP_GUID]
      })

      break;
    }
    case "PATCH": {
      const items = Object.entries(data).filter(e => e[0] !== "id").map(([key, value]) => {
        const i = value?.toString();
        return `${key}=${i ? `'${i}'` : 'NULL'}`;
      }).join(", ");

      await db.execute({
        query: `UPDATE profiles SET ${items} WHERE id = ?`,
        args: [data.id]
      });

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
