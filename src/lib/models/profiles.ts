import { z } from "zod";

export const profile = {
  name: "profile",
  schema: z.object({
    id: z.string().uuid(),
    // console: z.coerce.boolean().default(false),
    // is_demo: z.coerce.boolean().default(false),
    //disable_mulitplayer: z.coerce.boolean().default(false),
    // disable_chat: z.coerce.boolean().default(false),
    name: z.string(),
    created: z.string().datetime(),
    lastUsed: z.string().datetime(),
    icon: z.string().url().nullable(),
    lastVersionId: z.string(),
    //gameDir: z.string().nullable(),
    //javaDir: z.string().nullable(),
    javaArgs: z.string().nullable(),
    //logConfig: z.string().nullable(),
    //logConfigIsXML: z.coerce.boolean().default(true),
    resolution: z.string().transform((str, ctx) => {
      try {
        return JSON.parse(str);
      } catch (error) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
        return z.NEVER;
      }
    }).pipe(z.object({ width: z.number(), height: z.number() })).or(z.null()),
    active: z.coerce.boolean().default(false),
  })
}


export type MinecraftProfile = z.infer<typeof profile.schema>;