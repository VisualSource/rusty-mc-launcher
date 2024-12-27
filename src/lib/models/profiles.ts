import { z } from "zod";
import type { QueryResult } from "@lib/api/plugins/query";

const loaderSchema = z.enum([
	"vanilla",
	"forge",
	"fabric",
	"quilt",
	"neoforge",
]);

type Loader = z.infer<typeof loaderSchema>;

const profileState = z.enum(["UNINSTALLED", "INSTALLING", "INSTALLED"]);

export type ProfileState = z.infer<typeof profileState>;

export class Profile {
	static schema = z.object({
		id: z.string().uuid(),
		name: z.string(),
		date_created: z.string(),
		version: z.string(),
		loader: loaderSchema,
		last_played: z.string().optional().nullable().default(null),
		icon: z.ostring().nullable().default(null),
		loader_version: z.ostring().nullable().default(null),
		java_args: z.ostring().nullable().default(null),
		resolution_width: z.ostring().nullable().default(null),
		resolution_height: z.ostring().nullable().default(null),
		state: profileState.default("UNINSTALLED"),
	});
	public id: string;
	public name: string;
	public date_created: string;
	public version: string;
	public loader: Loader;
	public last_played: string | null;
	public loader_version: string | null;
	public icon: string | null;
	public java_args: string | null;
	public resolution_width: string | null;
	public resolution_height: string | null;
	public state: ProfileState = "UNINSTALLED";
	constructor(args: QueryResult) {
		this.id = args.id as string;
		this.name = args.name as string;
		this.date_created = args.date_created as string;
		this.version = args.version as string;
		this.loader = args.loader as Loader;
		this.last_played = args.last_played as string | null;
		this.loader_version = args.loader_version as string | null;
		this.icon = args.icon as string | null;
		this.java_args = args.java_args as string | null;
		this.resolution_width = args.resolution_width as string | null;
		this.resolution_height = args.resolution_height as string | null;
		this.state = args.state as ProfileState;
	}
}
