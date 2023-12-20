import { Schema, Type, type InferSchema } from "../db/sqlite";

const categories = new Schema(
  "categories",
  {
    id: Type.Text().primary_key(),
    group_id: Type.Integer().default(0),
    name: Type.Text().nullable(),
    profile_id: Type.Text(),
  },
  {
    forign: { profile_id: { table: "profile", column: "id" } },
    runAfterCreate: `
        INSERT INTO categories VALUES 
        ("50b9318f-f3c0-48ae-89d3-191d4406b573",1,"Favorites",NULL), 
        ("9a0e4e64-2b5d-4c53-a3ea-06080178866b",0,"Uncategorized",NULL);
   `,
  },
);

export type Categories = InferSchema<typeof categories>;

export default categories;
