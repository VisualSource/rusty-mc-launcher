import type { ActionFunction } from "react-router-dom";
import { toast } from "react-toastify";

import { queryClient } from "@/lib/config/queryClient";
import { db } from "@system/commands";
import { CATEGORIES_KEY } from "@hook/keys";

const handleCollections: ActionFunction = async ({ request }) => {
  const data = await request.formData();

  switch (request.method) {
    case "PATCH": {
      const id = data.get("id")?.toString();
      const name = data.get("name")?.toString();

      if (!id || !name) {
        toast.error("Failed to update collection!", {
          data: { event: "update-collection" },
        });
        return new Response(null, { status: 400 });
      }

      await db.execute({
        query: "UPDATE settings SET value = ? WHERE key = ?",
        args: [name, `category.${id}`],
      });

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });

      return new Response(null, { status: 200 });
    }
    case "DELETE": {
      const id = data.get("metadata")?.toString();

      if (!id) {
        toast.error("Failed to delete collection!", {
          data: { event: "delete-collection" },
        });
        return new Response(null, { status: 400 });
      }

      await db.execute({
        query: "DELETE FROM categories WHERE category = ?",
        args: [id],
      });

      await db.execute({
        query: "DELETE FROM settings WHERE key = ?",
        args: [`category.${id}`],
      });

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });

      return new Response(null, { status: 200 });
    }
    case "POST": {
      const name = data.get("name")?.toString();
      if (!name) return new Response(null, { status: 400 });

      const id = crypto.randomUUID();

      await db.execute({
        query: "INSERT INTO settings VALUES (?,?,?)",
        args: [`category.${id}`, id, name],
      });

      queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      return new Response(null, { status: 200 });
    }
    default:
      return new Response(null, { status: 200 });
  }
};

export default handleCollections;
