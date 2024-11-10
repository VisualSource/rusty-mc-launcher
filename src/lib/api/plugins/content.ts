import { invoke, type Channel } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";
import type { z } from "zod";
import type { Profile } from "@/lib/models/profiles";
import { transaction } from "./query";
import { ContentType } from "@/lib/models/download_queue";

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

export async function uninstallContent(contentType: keyof typeof ContentType, profileId: string, filename: string) {
	await invoke<void>("plugin:rmcl-content|uninstall_content", {
		content: contentType,
		filename,
		profile: profileId
	})
}

export async function createProfile(args: z.infer<typeof Profile.schema>, copy?: string) {
	const queueId = crypto.randomUUID();
	await invoke<void>("plugin:rmcl-content|create_profile", {
		profile: args.id,
		copy_from: copy
	});
	await transaction((tx) => {
		tx.query`INSERT INTO profiles (id,name,icon,date_created,version,loader,loader_version,java_args,resolution_width,resolution_height) VALUES (${args.id},${args.name},${args.icon},${args.date_created},${args.version},${args.loader_version},${args.java_args},${args.resolution_width},${args.resolution_height});`
		tx.query`INSERT INTO download_queue (id,priority,display_name,profile_id,content_type,metadata) VALUES (${queueId},1,${`Minecraft ${args.loader} ${args.version}`},${args.id},${ContentType.Client},${JSON.stringify({
			version: args.version,
			loader: args.loader.replace(/^\w/, args.loader[0].toUpperCase()),
			loader_version: args.loader_version,
		})});`;
	});
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
