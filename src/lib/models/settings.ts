import { z } from "zod";
import { query, type QueryResult } from "@lib/api/plugins/query";

export async function getConfig(id: string): Promise<Setting | undefined> {
	return query`SELECT * FROM settings WHERE key = ${id} LIMIT 1;`
		.as(Setting)
		.get();
}

export async function addConfig(
	option: string,
	value: string,
	metadata: string | null = null,
) {
	return query`INSERT INTO settings VALUES (${option},${value},${metadata})`.run();
}

export async function updateConfig(
	option: string,
	value: string,
	metadata?: string | null,
) {
	if (metadata !== undefined) {
		return query`UPDATE settings SET value = ${value}, metadata = ${metadata} WHERE key = ${option};`.run();
	}
	return query`UPDATE settings SET value = ${value} WHERE key = ${option};`.run();
}

export async function isOption(opt: string, value: string) {
	const item = await getConfig(opt);
	return item?.value === value;
}

export async function upsert(key: string, value: string) {
	const [affected] = await updateConfig(key, value);
	if (affected === 0) {
		await addConfig(key, value);
	}
}

export class Setting {
	static schema = z.object({
		key: z.string(),
		metadata: z.string().nullable(),
		value: z.string(),
	});
	static fromQuery(args: QueryResult) {
		const data = Setting.schema.parse(args);
		return new Setting(data);
	}

	public key: string;
	public metadata: string | null;
	public value: string;
	constructor(args: z.infer<typeof Setting.schema>) {
		this.key = args.key;
		this.metadata = args.metadata;
		this.value = args.value;
	}
}
