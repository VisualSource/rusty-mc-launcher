import { z } from "zod";

export const categories = {
  name: "categories",
  schema: z.object({
    id: z.string(),
    group_id: z.onumber().default(0),
    profile_id: z.string(),
    name: z.string().nullable()
  }),
  runAfterCreate: `
  INSERT INTO categories VALUES 
  ("50b9318f-f3c0-48ae-89d3-191d4406b573",1,"Favorites",NULL), 
  ("9a0e4e64-2b5d-4c53-a3ea-06080178866b",0,"Uncategorized",NULL);
`,
};

export type Categories = z.infer<typeof categories.schema>;

