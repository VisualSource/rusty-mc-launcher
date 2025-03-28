import { invoke } from "@tauri-apps/api/core";
import { query, sqlValue } from "./query";

export type LaunchConfig = {
	auth_player_name: string;
	auth_uuid: string;
	auth_access_token: string;
	auth_xuid: string;
	profile_id: string;
};
export async function launchGame(config: LaunchConfig) {
	try {
		await query`UPDATE profiles SET last_played = '${sqlValue(new Date().toISOString())}' WHERE id = ${config.profile_id}`.run();
		await invoke<void>("plugin:rmcl-game|launch_game", {
			config,
		});
	} catch (error) {
		if (error instanceof Error) throw error;
		throw new Error(error as string);
	}
}
export async function isRunning(id: string): Promise<boolean> {
	return invoke<boolean>("plugin:rmcl-game|is_running", {
		id,
	});
}
export async function stop(id: string) {
	return invoke<void>("plugin:rmcl-game|stop", {
		id,
	});
}

export async function listActiveProcesses(): Promise<{
	type: "List";
	data: string[];
}> {
	return invoke<{ type: "List"; data: string[] }>(
		"plugin:rmcl-game|list_active_processes",
	);
}
