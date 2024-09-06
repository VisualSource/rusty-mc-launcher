import { invoke } from "@tauri-apps/api/core";
import { type ZodTypeDef, z } from "zod";
import { workshop_content } from "../models/content";

type Query<S> = {
	query: string;
	args?: unknown[];
	schema: S;
};

type RowsAffected = number;
type LastInsertRowId = number;
/**
 * @deprecated
 */
export const db = {
	select: async <S extends z.Schema<unknown, ZodTypeDef>>({
		query,
		args = [],
		schema,
	}: Query<S>) => {
		const request = await invoke<unknown[]>("select", { query, args });
		return request.map((value) => schema.parse(value)) as z.infer<S>[];
	},
	execute: async ({ query, args = [] }: { query: string; args?: unknown[] }) =>
		invoke<[RowsAffected, LastInsertRowId]>("execute", { query, args }),
};

const uuidSchema = z.string().uuid();
/**
 * @deprecated
 */
export const isRunning = (profile: string) =>
	invoke<boolean>("is_running", { profile: uuidSchema.parse(profile) });
/**
 * @deprecated
 */
export const stop = (profile: string) =>
	invoke("stop", { profile: uuidSchema.parse(profile) });

const launchSchema = z.object({
	auth_player_name: z.string(),
	auth_uuid: z.string(),
	auth_access_token: z.string(),
	auth_xuid: z.string(),

	profile_id: uuidSchema,
});

export type LaunchConfig = z.infer<typeof launchSchema>;
/**
 * @deprecated
 */
export const launchGame = (config: LaunchConfig) =>
	invoke("launch_game", { config: launchSchema.parse(config) });

export const loaderSchema = z.enum([
	"vanilla",
	"forge",
	"fabric",
	"quilt",
	"neoforge",
]);
export type Loader = z.infer<typeof loaderSchema>;
/**
 * @deprecated
 */
export const installLocalMrPack = (source: string) =>
	invoke("install_local_mrpack", { file_path: source });
/**
 * @deprecated
 */
export const showInFolder = (path: string) =>
	invoke("show_in_folder", { path });
/**
 * @deprecated
 */
export const deleteProfile = (profile: string) =>
	invoke("delete_profile", { profile });
/**
 * @deprecated
 */
export const createProfile = (profile: string, copyOptions?: string) =>
	invoke("create_profile", { profile, copyOptions });
/**
 * @deprecated
 */
export const uninstallItem = async (
	content_type: string,
	filename: string,
	profile: string,
) =>
	invoke("uninstall_content", { contentType: content_type, filename, profile });
/**
 * @deprecated
 */
export const copy_profile = async (profile: string, newProfile: string) =>
	invoke("copy_profile", {
		profile,
		newProfile,
	});
/**
 * @deprecated
 */
export const uninstallContent = async (profile: string, id: string) => {
	const items = await db.select({
		query: "SELECT * FROM profile_content WHERE id = ? AND profile = ?",
		args: [id, profile],
		schema: workshop_content.schema,
	});
	const item = items.at(0);
	if (!item) return;

	await uninstallItem(item.type, item.file_name, profile);

	await db.execute({
		query: "DELETE FROM profile_content WHERE id = ? AND profile = ?",
		args: [id, profile],
	});
};
/**
 * @deprecated
 */
export const getSystemRam = async () => invoke<number>("get_system_ram");
/**
 * @deprecated
 */
export const importContentExternal = async (
	src: string,
	profile: string,
	contentType: "Resourcepack" | "Shader" | "Mod",
) =>
	invoke<void>("import_external", {
		contentType,
		profile,
		src,
	});
