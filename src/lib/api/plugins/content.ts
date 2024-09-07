import type { ContentType } from "@/lib/models/content";
import { invoke, type Channel } from "@tauri-apps/api/core";
import { Command } from "@tauri-apps/plugin-shell";

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
	return invoke<number>("plugin:rmcl-content|get_system_ram");
}

export async function uninstallContent(contentId: string, profileId: string) {
	throw new Error("TODO: implement uninstallContent");
}

export async function manualContentImport(contentType: ContentType, profileId: string, path: string) {
	throw new Error("TODO: implement manualContentImport");
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
