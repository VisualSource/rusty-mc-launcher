import { z } from "zod";

export const workshop_content = {
    name: "profile_content",
    schema: z.object({
        id: z.string(),
        sha1: z.string(),
        profile: z.string().uuid(),
        file_name: z.string(),
        version: z.ostring().nullable().default(null),
        type: z.enum(["Mod", "Resourcepack", "Shader", "Datapack"])
    })
}