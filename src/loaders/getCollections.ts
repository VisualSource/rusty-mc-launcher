import { json, type LoaderFunction } from "react-router-dom";
import DB from "@lib/api/db";
import { categories } from "@/lib/models/categories";

const getCollections: LoaderFunction = async () => {
  const db = DB.use();
  const result = await db.select(`SELECT name, id, group_id FROM ${categories.name} WHERE profile_id IS NULL`)
  return json(categories.schema.parse(result), { status: 200 });
};

export default getCollections;
