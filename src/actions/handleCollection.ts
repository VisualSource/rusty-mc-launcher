import type { ActionFunction } from "react-router-dom";
import { toast } from "react-toastify";

import { queryClient } from "@/lib/config/queryClient";
import { CATEGORIES_KEY } from "@hook/keys";
import categories from "@/lib/models/categories";

const handleCollections: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  console.log(Object.fromEntries(data.entries()));
  switch (request.method) {
    case "PATCH": {
      const id = data.get("id")?.toString();
      const name = data.get("collection-name")?.toString();

      if (!id || !name) {
        toast.error("Failed to update collection!", {
          data: { event: "update-collection", type: "Invaild id or name" },
        });
        return new Response(null, { status: 400 });
      }

      await categories.execute("UPDATE %table% Set name = ? WHERE id = ?", [
        name,
        id,
      ]);

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      break;
    }
    case "DELETE": {
      const id = data.get("id")?.toString();
      const group_id = parseInt(data.get("group_id")?.toString() ?? "");

      if (!id || !Number.isInteger(group_id)) {
        toast.error("Failed to delete collection!", {
          data: { event: "delete-collection", type: "Invaild id or group_id" },
        });
        return new Response(null, { status: 400 });
      }

      await categories.execute("DELETE FROM %table% WHERE id = ?;", [id]);
      await categories.execute("DELETE FROM %table% WHERE group_id = ?;", [
        group_id,
      ]);

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });

      break;
    }
    case "POST": {
      const name = data.get("collection-name")?.toString();
      if (!name) return new Response(null, { status: 400 });

      const result = await categories.execute<{ max: number }>(
        "SELECT MAX(group_id) as max FROM %table%;",
      );
      const group_id = ((result?.at(0) as { max: number })?.max ?? 1) + 1;

      await categories.execute("INSERT INTO %table% VALUES (?,?,?, NULL)", [
        crypto.randomUUID(),
        group_id,
        name,
      ]);

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      break;
    }
    default:
      break;
  }

  return new Response(null, { status: 200 });
};

export default handleCollections;
