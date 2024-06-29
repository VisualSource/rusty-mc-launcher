import { z } from "zod";
import { QueueItemState } from "../QueueItemState";
import { db } from "../system/commands";

const contentTypeSchema = z.enum([
	"Client",
	"Modpack",
	"Mod",
	"Resourcepack",
	"Shader",
	"Datapack",
	"CurseforgeModpack"
]);

export type ContentType = z.infer<typeof contentTypeSchema>;

export const download_queue = {
	name: "download_queue",
	schema: z.object({
		id: z.string().uuid(),
		display: z.number().transform((arg) => arg === 1),
		install_order: z.number().gte(0),
		display_name: z.string(),
		icon: z.ostring().nullable().default(null),
		profile_id: z.string().uuid(),
		created: z.string(),
		metadata: z
			.string()
			.transform((arg, ctx) => {
				try {
					return JSON.parse(arg);
				} catch (error) {
					ctx.addIssue({
						fatal: true,
						message: (error as Error).message,
						code: "custom",
					});
					return z.NEVER;
				}
			})
			.pipe(z.object({}).passthrough()),
		content_type: contentTypeSchema,
		state: z.enum([
			QueueItemState.COMPLETED,
			QueueItemState.CURRENT,
			QueueItemState.ERRORED,
			QueueItemState.PENDING,
			QueueItemState.POSTPONED,
		]),
	}),

	async insert(
		queue_id: string,
		display: boolean,
		priority: number,
		title: string,
		icon: string | null,
		profile_id: string,
		content_type: ContentType,
		metadata: Record<string, unknown>,
		state: keyof typeof QueueItemState = "PENDING",
	) {
		return db.execute({
			query: "INSERT INTO download_queue VALUES (?,?,?,?,?,?,?,?,?,?);",
			args: [
				queue_id,
				display ? 1 : 0,
				priority,
				title,
				icon,
				profile_id,
				new Date().toISOString(),
				content_type,
				JSON.stringify(metadata),
				state,
			],
		});
	},
};

export type QueueItem = z.infer<typeof download_queue.schema>;
