import { z } from "zod";
import { query } from "@lib/api/plugins/query";
import type { QueryResult } from "../api/plugins/query";

export async function getConfig(id: string): Promise<Setting | undefined> {
	return query("SELECT * FROM settings WHERE key = ? LIMIT 1", [id]).as(Setting).get();
}

export async function isOption(opt: string, value: string) {
	const item = await getConfig(opt);
	return item?.value === value;
}

export class Setting {
	static schema = z.object({
		key: z.string(),
		metadata: z.string().nullable(),
		value: z.string(),
	});
	public key: string;
	public metadata: string | null;
	public value: string;
	constructor(args: QueryResult) {
		this.key = args.key as string;
		this.metadata = args.metadata as string | null;
		this.value = args.value as string;
	}
}
/*
export const settings = {
	name: "settings",
	schema: ,

	async getLike(value: string) {
		return db.select({
			query: `SELECT * FROM settings WHERE key LIKE '${value}';`,
			schema: settings.schema,
		});
	},

	async update(key: string, value: string) {
		return db.execute({
			query: "UPDATE settings SET value = ? WHERE key = ?;",
			args: [value, key],
		});
	},

	async insert(key: string, value: string, metadata: string | null = null) {
		await db.execute({
			query: "INSERT INTO settings VALUES (?,?,?)",
			args: [key, metadata, value],
		});
	},

	async is_true(key: string) {
		const result = await this.select(key);

		const setting = result.at(0);
		if (!setting) return false;
		return setting.value === "TRUE";
	},

	async get_setting(key: string) {
		const reuslt = await this.select(key);
		const setting = reuslt.at(0);
		if (!setting) throw new Error(`No key with name ${key} exists.`);
		return setting;
	},

	async select(key: string) {
		return db.select({
			query: "SELECT * FROM settings WHERE key = ?",
			args: [key],
			schema: settings.schema,
		});
	},
};

export type Setting = z.infer<typeof settings.schema>;*/
