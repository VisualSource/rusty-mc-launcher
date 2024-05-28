import { z } from "zod";
import { db } from "../system/commands";

export const settings = {
  name: "settings",
  schema: z.object({
    key: z.string(),
    metadata: z.string().nullable(),
    value: z.string(),
  }),

  async update(key: string, value: string) {
    return db.execute({
      query: "UPDATE settings SET value = ? WHERE key = ?;",
      args: [value, key],
    });
  },
  async select(key: string) {
    return db.select({
      query: "SELECT * FROM settings WHERE key = ?",
      args: [key],
      schema: settings.schema,
    });
  },
};

export type Setting = z.infer<typeof settings.schema>;
