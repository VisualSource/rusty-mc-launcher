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

const profileState = z.enum(["UNINSTALLED", "INSTALLING", "INSTALLED", "ERRORED", "UNKNOWN"]);

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
		is_modpack: z.ostring().nullable().default(null),
		loader_version: z.ostring().nullable().default(null),
		java_args: z.ostring().nullable().default(null),
		resolution_width: z.ostring().nullable().default(null),
		resolution_height: z.ostring().nullable().default(null),
		state: profileState.default("UNINSTALLED"),
	});
	static fromQuery(args: QueryResult) {
		const data = Profile.schema.parse(args);
		return new Profile(data);
	}

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
	public isModpack: string | null;
	public state: ProfileState = "UNINSTALLED";
	constructor(args: z.infer<typeof Profile.schema>) {
		this.id = args.id;
		this.name = args.name;
		this.date_created = args.date_created;
		this.version = args.version;
		this.loader = args.loader;
		this.last_played = args.last_played;
		this.loader_version = args.loader_version;
		this.icon = args.icon;
		this.java_args = args.java_args;
		this.resolution_width = args.resolution_width;
		this.resolution_height = args.resolution_height;
		this.state = args.state;
		this.isModpack = args.is_modpack;
	}
}
