import { queryClient } from "@/lib/config/queryClient";
import { CATEGORIES_KEY, CATEGORY_KEY } from "@/lib/hooks/keys";
import categories from "@/lib/models/categories";
import type { ActionFunction } from "react-router-dom";
import { toast } from "react-toastify";

const updateCollection: ActionFunction = async ({ request }) => {
  const data = await request.formData();
  const id = data.get("id")?.toString();

  if (!id) {
    toast.error("Failed to update collection");
    return new Response(null, {
      headers: {
        Location: `/`,
      },
      status: 302,
    });
  }

  const collection = parseInt(data.get("collection")?.toString() ?? "");
  if (!Number.isInteger(collection)) {
    toast.error("Failed to update collection");
    return new Response(null, {
      headers: {
        Location: `/profile/${id}`,
      },
      status: 302,
    });
  }

  switch (request.method) {
    case "DELETE": {
      await categories.delete({
        where: [{ profile_id: id }, { AND: { group_id: collection } }],
      });
      break;
    }
    case "POST": {
      await categories.execute("INSERT INTO %table% VALUES (?,?,NULL,?);", [
        crypto.randomUUID(),
        collection,
        id,
      ]);
      break;
    }
    default:
      break;
  }

  queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY, collection] });
  queryClient.invalidateQueries({ queryKey: ["PROFILE_CATEGORIES", id] });
  queryClient.invalidateQueries({ queryKey: [CATEGORIES_KEY] });

  return new Response(null, {
    headers: {
      Location: `/profile/${id}`,
    },
    status: 302,
  });
};

export default updateCollection;
