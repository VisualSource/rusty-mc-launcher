import { json, type LoaderFunction } from "react-router-dom";
import { settings } from "@lib/models/settings";
import { db } from "@system/commands";

const getCollections: LoaderFunction = async () => {
  const result = await db.select({
    query: `SELECT * FROM settings WHERE key LIKE 'category.%';`,
    schema: settings.schema,
  });
  return json(result, { status: 200 });
};

export default getCollections;
