import { z } from "zod";

export const download_queue = {
    name: "download_queue",
    schema: z.object({
        id: z.string().uuid(),
        display: z.number().transform((arg) => arg === 1),
        install_order: z.number().gte(0),
        display_name: z.string(),
        icon: z.ostring().nullable().default(null),
        profile_id: z.string().uuid(),
        created: z.string().datetime(),
        metadata: z.string().transform((arg, ctx) => {
            try {
                return JSON.parse(arg)
            } catch (error) {
                ctx.addIssue({
                    fatal: true,
                    message: (error as Error).message,
                    code: "custom"
                });
                return z.NEVER;
            }
        }).pipe(z.object({}).passthrough()),
        content_type: z.enum(["client", "modpack", "mod", "resource", "shader", "datapack"]),
        state: z.enum(["PENDING", "ERRORED", "CURRENT", "POSTPONED", "COMPLETED"])
    })
}

export type QueueItem = z.infer<typeof download_queue.schema>;
