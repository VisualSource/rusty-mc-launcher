import { z } from "zod";
import { loaderSchema } from "../system/commands";

export const profile = {
  name: "profiles",
  schema: z.object({
    id: z.string().uuid(),
    name: z.string(),

    date_created: z.string().datetime(),

    version: z.string(),
    loader: loaderSchema,

    last_played: z.string().datetime().nullable(),
    icon: z.string().nullable(),
    loader_version: z.string().nullable(),

    java_args: z.string().nullable(),

    resolution_width: z.string().nullable(),
    resolution_height: z.string().nullable(),
  })
}


export type MinecraftProfile = z.infer<typeof profile.schema>;