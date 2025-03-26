import { z } from "zod";
import { type QueryResult, query } from "../api/plugins/query";
import { QueueItemState } from "../QueueItemState";

export const contentTypeSchema = z.enum([
	"Client",
	"Mod",
	"Modpack",
	"Resourcepack",
	"Shader",
	"Datapack",
	"CurseforgeModpack",
	"SystemUpdate",
]);
export const ContentType = z.util.arrayToEnum([
	"Client",
	"Modpack",
	"Resourcepack",
	"Mod",
	"Shader",
	"Datapack",
	"CurseforgeModpack",
	"SystemUpdate",
]);

export class QueueItem {
	static schema = z.object({
		id: z.string().uuid(),
		display: z.coerce.boolean(),
		priority: z.number().gte(0),
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
						message: (error as Error)?.message,
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
	});
	static async insert(
		args: z.infer<typeof QueueItem.schema> & {
			metadata: Record<string, unknown>;
		},
	) {
		return query`INSERT INTO download_queue VALUES (${args.id},${args.display ? 0 : 1},${args.priority},${args.display_name},${args.icon},${args.profile_id},${new Date().toISOString()},${args.content_type},${JSON.stringify(args.metadata)},${args.state});`.run();
	}
	static fromQuery(args: QueryResult) {
		const data = QueueItem.schema.parse(args);
		return new QueueItem(data);
	}
	public id: string;
	public display: boolean;
	public priority: number;
	public display_name: string;
	public icon: string | null;
	public profile_id: string;
	public created: string;
	public metadata: Record<string, unknown>;
	public content_type: z.infer<typeof contentTypeSchema>;
	public state: keyof typeof QueueItemState = "PENDING";
	constructor(args: z.infer<typeof QueueItem.schema>) {
		this.state = args.state;
		this.id = args.id;
		this.display = args.display;
		this.priority = args.priority;
		this.display_name = args.display_name;
		this.icon = args.icon;
		this.profile_id = args.profile_id;
		this.created = args.created;
		this.metadata = args.metadata;
		this.content_type = args.content_type;
	}
}
