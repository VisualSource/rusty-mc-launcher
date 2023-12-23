import { json, type LoaderFunction } from "react-router-dom";
import categories from "@/lib/models/categories";

const getCollections: LoaderFunction = async () => {
  const results = await categories.execute(
    "SELECT name, id, group_id FROM %table% WHERE profile_id IS NULL",
  );
  return json(results, { status: 200 });
};

export default getCollections;
