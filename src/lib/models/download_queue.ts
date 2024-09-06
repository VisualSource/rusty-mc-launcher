import { z } from "zod";
import { QueueItemState } from "../QueueItemState";
import { type QueryResult, query } from "../api/plugins/query";

const contentTypeSchema = z.enum([
	"Client",
	"Modpack",
	"Mod",
	"Resourcepack",
	"Shader",
	"Datapack",
	"CurseforgeModpack",
]);

export type ContentType = z.infer<typeof contentTypeSchema>;
export class QueueItem {
	static schema = z.object({
		id: z.string().uuid(),
		display: z.number().transform((arg) => arg === 1),
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
	});
	static async insert(
		args: z.infer<typeof QueueItem.schema> & {
			metadata: Record<string, unknown>;
		},
	) {
		return query("INSERT INTO download_queue VALUES (?,?,?,?,?,?,?,?,?,?);", [
			args.id,
			args.display ? 0 : 1,
			args.priority,
			args.display_name,
			args.icon,
			args.profile_id,
			new Date().toISOString(),
			args.content_type,
			JSON.stringify(args.metadata),
			args.state,
		]).run();
	}
	public id: string;
	public display: boolean;
	public priority: number;
	public display_name: string;
	public icon: string | null;
	public profile_id: string;
	public created: string;
	public metadata: Record<string, unknown>;
	public content_type: ContentType;
	public state: keyof typeof QueueItemState = "PENDING";
	constructor(args: QueryResult) {
		this.id = args.id as string;
		this.display = (args.display as number) === 0;
		this.priority = args.priority as number;
		this.display_name = args.display_name as string;
		this.icon = args.icon as string | null;
		this.profile_id = args.profile_id as string;
		this.created = args.created as string;
		this.metadata = JSON.parse(args.metadata as string) as Record<
			string,
			unknown
		>;
		this.content_type = args.content_type as ContentType;
	}
}
