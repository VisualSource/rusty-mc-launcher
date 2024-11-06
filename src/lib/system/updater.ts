import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { ask } from "@tauri-apps/plugin-dialog";
import logger from "@lib/system/logger";

export class Updater {
	async checkForUpdate() {
		logger.info("Checking for update");
		const update = await check();
		if (!update?.available) return;
		logger.info("New update found");

		await update.downloadAndInstall((ev) => {
			console.log(ev);
		});

		const result = await ask(
			`Version ${update.version} is available (Current ${update.currentVersion}) Would you like to update?`,
			{ title: "Update", kind: "info" },
		);
		if (!result) return;

		await relaunch();
	}
}
