import { invoke, type Channel } from "@tauri-apps/api/core";

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
