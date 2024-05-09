import type { LoaderFunction } from "react-router-dom";
import { fromZodError } from "zod-validation-error";
import { profile } from "@lib/models/profiles";
import DB from "@lib/api/db";

const getProfile: LoaderFunction = async ({ params }) => {
  if (!params.id) return new Error("Invalid profile id");
  const db = DB.use();
  const result = await db.select<unknown[]>(`SELECT * FROM ${profile.name} WHERE id = ?`, [params.id]);
  const data = profile.schema.safeParse(result.at(0));

  if (data.error) {
    return fromZodError(data.error);
  }

  return data.data;
};

export default getProfile;
