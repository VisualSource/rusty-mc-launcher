import { z } from "zod";

const contentTypeSchema = z.enum(["Mod", "Resourcepack", "Shader", "Datapack"]);

export type ContentType = z.infer<typeof contentTypeSchema>;

export const workshop_content = {
	name: "profile_content",
	schema: z.object({
		id: z.string(),
		sha1: z.string(),
		profile: z.string().uuid(),
		file_name: z.string(),
		version: z.ostring().nullable().default(null),
		type: contentTypeSchema,
	}),
};

export type ProfileContentItem = z.infer<typeof workshop_content.schema>;