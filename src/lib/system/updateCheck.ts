import { check } from "@tauri-apps/plugin-updater";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { info } from "@tauri-apps/plugin-log";

export async function checkForAppUpdate(forceCheck = false) {
    await info("Checking for updates")
    const update = await check();
    if (!update) {
        await info("No updates founds.");

        if (forceCheck) {
            await message("You are on the latest version.", {
                kind: "info",
                title: "No Updates",
                okLabel: "Ok"
            });
        }

        return;
    }

    if (!update.available) return;
    await info(`Update ${update.version} was found!`);

    const yes = await ask(`Version ${update.version} is available! You are on version ${update.currentVersion}.`, {
        title: "Update Available",
        kind: "info",
        okLabel: "Update",
        cancelLabel: "Later"
    });

    if (!yes) {
        await info("Update was postponed");
        return;
    }

    await update.downloadAndInstall()
}