import { z } from "zod";
import { contentTypeSchema, type ContentType } from "./download_queue";
import type { QueryResult } from "../api/plugins/query";
export class ContentItem {
	static schema = z.object({
		id: z.string(),
		sha1: z.string(),
		profile: z.string().uuid(),
		file_name: z.string(),
		version: z.ostring().nullable().default(null),
		type: contentTypeSchema,
	});

	static fromQuery(args: QueryResult) {
		const data = ContentItem.schema.parse(args);
		return new ContentItem(data);
	}

	public id: string;
	public sha1: string;
	public profile: string;
	public file_name: string;
	public version: string | null;
	public type: keyof typeof ContentType;
	constructor(args: z.infer<typeof ContentItem.schema>) {
		this.id = args.id;
		this.sha1 = args.sha1;
		this.profile = args.profile;
		this.file_name = args.file_name;
		this.version = args.version;
		this.type = args.type;
	}
}
