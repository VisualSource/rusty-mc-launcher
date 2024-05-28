import { z } from "zod";
import { loaderSchema } from "../system/commands";

export const profile = {
  name: "profiles",
  schema: z.object({
    id: z.string().uuid(),
    name: z.string(),
    date_created: z.string(),
    version: z.string(),
    loader: loaderSchema,

    last_played: z.string().datetime().optional().nullable().default(null),
    icon: z.ostring().nullable().default(null),
    loader_version: z.ostring().nullable().default(null),

    java_args: z.ostring().nullable().default(null),

    resolution_width: z.ostring().nullable().default(null),
    resolution_height: z.ostring().nullable().default(null),

    state: z
      .enum(["UNINSTALLED", "INSTALLING", "INSTALLED"])
      .default("UNINSTALLED"),
  }),
};

export type MinecraftProfile = z.infer<typeof profile.schema>;
