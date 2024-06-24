import { z } from "zod";
import { db, loaderSchema } from "../system/commands";

export const profile = {
	name: "profiles",
	schema: z.object({
		id: z.string().uuid(),
		name: z.string(),
		date_created: z.string(),
		version: z.string(),
		loader: loaderSchema,

		last_played: z.string().optional().nullable().default(null),
		icon: z.ostring().nullable().default(null),
		loader_version: z.ostring().nullable().default(null),

		java_args: z.ostring().nullable().default(null),

		resolution_width: z.ostring().nullable().default(null),
		resolution_height: z.ostring().nullable().default(null),

		state: z
			.enum(["UNINSTALLED", "INSTALLING", "INSTALLED"])
			.default("UNINSTALLED"),
	}),
	async delete(id: string) {
		return db.execute({
			query: "DELETE FROM profiles WHERE id = ?;",
			args: [id]
		})
	},
	async get(id: string) {
		const profiles = await db.select<typeof profile.schema>({
			query: "SELECT * FROM profiles WHERE id = ? LIMIT 1;",
			args: [id],
			schema: profile.schema,
		});

		const item = profiles.at(0);
		if (!item) throw new Error(`No profile found with id of ${id}`);

		return item;
	}
};

export type MinecraftProfile = z.infer<typeof profile.schema>;
