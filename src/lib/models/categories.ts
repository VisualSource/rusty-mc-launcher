import { Schema, Type, type InferSchema } from "../db/sqlite";

const categories = new Schema("categories", {
    id: Type.Integer().primary_key().auto_increment(),
    group_id: Type.Integer().default(0),
    name: Type.Text(),
    profile_id: Type.Text()
}, {
    forign: { profile_id: { table: "profile", column: "id" } },
    runAfterCreate: `
        INSERT INTO categories VALUES (0,"Favorites",1);
        INSERT INTO categories VALUES (1,"Uncategorized",0);
   `
});

export type Categories = InferSchema<typeof categories>;

export default categories;