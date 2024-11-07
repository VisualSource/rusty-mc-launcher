import { invoke } from "@tauri-apps/api/core";

export type LaunchConfig = {
	auth_player_name: string,
	auth_uuid: string,
	auth_access_token: string,
	auth_xuid: string,
	profile_id: string,
}
export async function launchGame(config: LaunchConfig) {
	await invoke<void>("plugin:rmcl-game|launch_game", {
		config
	});
}
export async function isRunning(id: string): Promise<boolean> {
	return invoke<boolean>("plugin:rmcl-game|is_running", {
		id
	});
}
export async function stop(id: string) {
	return invoke<void>("plugin:rmcl-game|stop", {
		id
	});
}
