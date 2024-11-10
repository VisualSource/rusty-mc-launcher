import { z } from "zod";
import { query, type QueryResult } from "../api/plugins/query";

export const FAVORITES_GUID = "aa0470a6-89e9-4404-a71c-008ee2025e72";
export const UNCATEGORIZEDP_GUID = "40b8bf8c-5768-4c0d-82ba-8c00bb181cd8";

export class Category {
	static schema = z.object({
		id: z.number().int().positive(),
		profile: z.string().uuid(),
		category: z.string().uuid(),
	})

	public id: number;
	public profile: string
	public category: string;
	constructor(args: QueryResult) {
		this.id = args.id as number;
		this.profile = args.profile as string;
		this.category = args.category as string;
	}
}

export function getCategoriesFromProfile(profile: string) {
	return query`SELECT * FROM categories WHERE profile = ${profile};`.as(Category).all()
}