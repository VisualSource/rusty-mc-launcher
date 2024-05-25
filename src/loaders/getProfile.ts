import type { LoaderFunction } from "react-router-dom";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { profile } from "@lib/models/profiles";
import { db } from "@system/commands";

const getProfile: LoaderFunction = async ({ params }) => {
  if (!params.id) return new Error("Invalid profile id");

  try {
    const result = await db.select<typeof profile.schema>({
      query: `SELECT * FROM profiles WHERE id = ?`,
      args: [params.id],
      schema: profile.schema,
    });
    const item = result.at(0);

    return item;
  } catch (error) {
    if (error instanceof ZodError) {
      return fromZodError(error);
    }

    return error;
  }
};

export default getProfile;
