import { z } from "zod";
import type { QueryResult } from "../api/plugins/query";
import { contentTypeSchema, type ContentType } from "./download_queue";

export class ContentItem {
	static schema = z.object({
		id: z.string(),
		sha1: z.string(),
		profile: z.string().uuid(),
		file_name: z.string(),
		version: z.ostring().nullable().default(null),
		type: contentTypeSchema,
	});
	public id: string;
	public sha1: string;
	public profile: string;
	public file_name: string;
	public version: string | null;
	public type: keyof typeof ContentType;
	constructor(args: QueryResult) {
		this.id = args.id as string;
		this.sha1 = args.sha1 as string;
		this.profile = args.profile as string;
		this.file_name = args.file_name as string;
		this.version = args.version as string | null;
		this.type = args.type as keyof typeof ContentType;
	}
}
