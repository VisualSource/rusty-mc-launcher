import { invoke, type Channel } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import type { z } from "zod";
import type { ContentType } from "@/lib/models/content";
import type { Profile } from "@/lib/models/profiles";

export type DownloadEvent =
	| {
		event: "started";
		data: {
			max_progress: number;
			message: string;
		};
	}
	| {
		event: "progress";
		data: {
			amount?: number;
			message?: string;
		};
	}
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
	return value;
}

export async function uninstallContent(contentType: ContentType, profileId: string, filename: string) {
	await invoke<void>("plugin:rmcl-content|uninstall_content", {
		content: contentType,
		filename,
		profile: profileId
	})
}

export async function createProfile(args: z.infer<typeof Profile.schema>, copy?: string) {

	// insert profile db

	await invoke<void>("plugin:rmcl-content|create_profile", {
		profile: args.id,
		copy_from: copy
	});

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

export async function copyProfile(oldProfile: string, newProfile: string) {

	// TODO: do db stuff here to create new profile

	await invoke<void>("plugin:rmcl-content|copy_profile", {
		new_profile: newProfile,
		old_profile: oldProfile
	});
}

export async function deleteProfile(profileId: string) {

	// TODO: delete profile from db

	await invoke<void>("plugin:rmcl-content|delete_profile", {
		profile: profileId
	});
}

export async function showInFolder(path: string) {
	// TODO: add support for other systems
	const cmd = Command.create("windows-open-file", [path]);
	await cmd.execute();
}
