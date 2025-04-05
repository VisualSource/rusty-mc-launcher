import { z } from "zod";
import { type QueryResult, query } from "../api/plugins/query";
import { QueueItemState } from "../QueueItemState";

type InsertArgs =
	Omit<z.infer<typeof QueueItem.schema>, "id" | "created" | "display" | "state" | "priority"> &
	Partial<Pick<z.infer<typeof QueueItem.schema>, "id" | "created" | "display" | "state" | "priority">> &
	{ metadata: Record<string, unknown>; }

export const contentTypeSchema = z.enum([
	"Client",
	"Mod",
	"Modpack",
	"Resourcepack",
	"Shader",
	"Datapack",
	"CurseforgeModpack",
	"Update"
]);
export const ContentType = z.util.arrayToEnum([
	"Client",
	"Modpack",
	"Resourcepack",
	"Mod",
	"Shader",
	"Datapack",
	"CurseforgeModpack"
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
		completed: z.ostring().nullable().default(null),
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
		])
	});
	static async insert({
		id = crypto.randomUUID(),
		priority = 0,
		display = true,
		created = new Date().toISOString(),
		state = QueueItemState.PENDING,
		...args }: InsertArgs
	) {
		return query`INSERT INTO download_queue VALUES (${id},${display ? 1 : 0},${priority},${args.display_name},${args.icon},${args.profile_id},${created},${args.content_type},${JSON.stringify(args.metadata)},${state},${null});`.run();
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
	public completed: string | null;
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
		this.completed = args.completed;
	}
}
