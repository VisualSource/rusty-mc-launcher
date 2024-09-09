import type { ContentType } from "@/lib/models/content";
import type { Profile } from "@/lib/models/profiles";
import { invoke, type Channel } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import type { z } from "zod";

export type DownloadEvent =
	| { event: "started"; data: unknown }
	| { event: "progress"; data: { amount: number } }
	| { event: "finished"; data: unknown };

export async function registerDownloadListener(
	channel: Channel<DownloadEvent>,
) {
	return invoke<void>("plugin:rmcl-content|downloads_listener", {
		onEvent: channel,
	});
}

export async function getSystemRam() {
	const value = await invoke<number>("plugin:rmcl-content|get_system_ram");
	console.log(value);
	return value;
}

export async function uninstallContent(contentId: string, profileId: string) {
	throw new Error("TODO: implement uninstallContent");
}

export async function manualContentImport(contentType: ContentType, profileId: string, path: string) {
	throw new Error("TODO: implement manualContentImport");
}

export async function createProfile(args: z.infer<typeof Profile.schema>) {
	/*
	await db.execute({
				query: `BEGIN TRANSACTION;
					INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
					INSERT INTO download_queue VALUES (?,?,
					(SELECT COUNT(*) as count FROM download_queue WHERE state = 'PENDING'),
					?,?,?,?,?,?,?);
				COMMIT;`,
				args: [
					ev.id,
					ev.name,
					ev.icon ?? null,
					ev.date_created,
					ev.last_played ?? null,
					version,
					ev.loader,
					ev.loader_version ?? null,
					ev.java_args ?? null,
					ev.resolution_width ?? null,
					ev.resolution_height ?? null,
					"INSTALLING",
					queue_id,
					1,
					`Minecraft ${version} ${ev.loader}`,
					null,
					ev.id,
					new Date().toISOString(),
					"Client",
					JSON.stringify({
						version: version,
						loader: ev.loader.replace(/^\w/, ev.loader[0].toUpperCase()),
						loader_version: ev.loader_version,
					}),
					"PENDING",
				],
			});
	*/
	throw new Error("TODO: implement createProfile");
}

export async function copyProfile(oldId: string, nextId: string) {
	throw new Error("TOD: implement copyProfile");
}

export async function deleteProfile(profileId: string) {
	throw new Error("TOD: implement profileId");
}

export async function showInFolder(path: string) {
	// TODO: add support for other systems
	const cmd = Command.create("windows-open-file", [path]);
	await cmd.execute();
}
