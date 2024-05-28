import type { LoaderFunction } from "react-router-dom";
import { fromZodError } from "zod-validation-error";
import { ZodError } from "zod";
import { profile } from "@lib/models/profiles";
import { db } from "@system/commands";
import logger from "@system/logger";

const getProfile: LoaderFunction = async ({ params }) => {
  if (!params.id) return new Error("Invalid profile id");

  try {
    const result = await db.select<typeof profile.schema>({
      query: `SELECT * FROM profiles WHERE id = ?`,
      args: [params.id],
      schema: profile.schema,
    });
    const item = result.at(0);
    if (!item) throw new Error("No profile was found");

    return item;
  } catch (error) {
    if (error instanceof ZodError) {
      logger.error(error.message);
      return fromZodError(error);
    }

    logger.error((error as Error).message);
    return error;
  }
};

export default getProfile;
