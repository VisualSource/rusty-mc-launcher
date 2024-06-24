import { z } from "zod";
import { db } from "../system/commands";

export const FAVORITES_GUID = "aa0470a6-89e9-4404-a71c-008ee2025e72";
export const UNCATEGORIZEDP_GUID = "40b8bf8c-5768-4c0d-82ba-8c00bb181cd8";
export const categories = {
	name: "categories",
	schema: z.object({
		id: z.number().int().positive(),
		profile: z.string().uuid(),
		category: z.string().uuid(),
	}),

	async getCategoriesForProfile(id: string) {
		const items = await db.select({
			query: "SELECT * FROM categories WHERE profile = ?;",
			args: [id],
			schema: categories.schema,
		});
		return items;
	}
};

export type Category = z.infer<typeof categories.schema>;
