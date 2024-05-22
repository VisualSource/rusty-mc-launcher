import { z } from "zod";

export const categories = {
  name: "categories",
  schema: z.object({
    id: z.number().int().positive(),
    profile: z.string().uuid(),
    category: z.string().uuid()
  }),
};

export type Category = z.infer<typeof categories.schema>;

