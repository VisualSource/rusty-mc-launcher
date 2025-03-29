import { ask, message } from "@tauri-apps/plugin-dialog";
import { check } from "@tauri-apps/plugin-updater";
import { type Id, toast } from "react-toastify";
import { info } from "@tauri-apps/plugin-log";
import {
	toastLoading,
	toastUpdateInfo,
	toastUpdateProgress,
	toastUpdateSuccess,
} from "../toast";

export async function checkForAppUpdate(forceCheck = false) {
	let toastId: Id | undefined;

	await info("Checking for updates");

	if (forceCheck) {
		toastId = toastLoading({
			title: "Checking for updates",
		});
	}

	const update = await check();

	if (!update) {
		await info("No updates founds.");

		if (toastId) {
			toastUpdateSuccess(toastId, {
				title: "No updates available!",
			});
			await message("You are on the latest version.", {
				kind: "info",
				title: "No Updates",
				okLabel: "Ok",
			});
		}
		return;
	}

	if (!update.available) {
		if (toastId)
			toastUpdateSuccess(toastId, {
				title: "No updates available!",
			});

		await info("No update was found.");
		return;
	}
	await info(`Update ${update.version} was found!`);

	const yes = await ask(
		`Version ${update.version} is available! You are on version ${update.currentVersion}.`,
		{
			title: "Update Available",
			kind: "info",
			okLabel: "Update",
			cancelLabel: "Later",
		},
	);

	if (!yes) {
		await info("Update was postponed");
		if (toastId)
			toastUpdateInfo(toastId, {
				title: `Update ${update.version}`,
				description: `Current Version ${update.currentVersion}`,
			});
		return;
	}

	let contentLength = 0;
	let currentLength = 0;
	const newRange = 1 - 0;
	let oldRange = 0;
	await update.downloadAndInstall((ev) => {
		switch (ev.event) {
			case "Started": {
				contentLength = ev.data.contentLength ?? 0;
				oldRange = contentLength - 0;
				const progress = ((contentLength - 0) * newRange) / oldRange;
				if (toastId)
					toastUpdateProgress(toastId, {
						title: "Downloading Update",
						progress,
					});
				break;
			}
			case "Progress": {
				currentLength += ev.data.chunkLength;
				const progress = (currentLength * newRange) / oldRange;
				if (toastId)
					toastUpdateProgress(toastId, {
						title: "Downloading Update",
						progress,
					});
				break;
			}
			case "Finished": {
				if (toastId) toast.done(toastId);
				break;
			}
		}
	});
}
