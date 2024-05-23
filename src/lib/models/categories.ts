import { z } from "zod";

export const FAVORITES_GUID = "aa0470a6-89e9-4404-a71c-008ee2025e72";
export const UNCATEGORIZEDP_GUID = "40b8bf8c-5768-4c0d-82ba-8c00bb181cd8";
export const categories = {
  name: "categories",
  schema: z.object({
    id: z.number().int().positive(),
    profile: z.string().uuid(),
    category: z.string().uuid()
  }),
};

export type Category = z.infer<typeof categories.schema>;

