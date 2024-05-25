import { z } from "zod";

export const settings = {
  name: "settings",
  schema: z.object({
    key: z.string(),
    metadata: z.string().nullable(),
    value: z.string(),
  }),
};

export type Setting = z.infer<typeof settings.schema>;
