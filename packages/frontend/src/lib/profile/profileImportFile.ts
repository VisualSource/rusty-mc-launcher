import { open } from "@tauri-apps/plugin-dialog";
import { error } from "@tauri-apps/plugin-log";
import type { Id } from "react-toastify";

import { queryClient } from "@/lib/api/queryClient";
import { importFile } from "../api/plugins/content";
import { toastLoading, toastUpdateError, toastUpdateSuccess } from "../toast";

export async function profileImportFile(
	profile: string,
	type: "Mod" | "Resourcepack" | "Shader",
) {
	let toastId: Id | undefined;
	try {
		const file = await open({
			title: "Import Content",
			filters: [
				{
					name: "Mod",
					extensions: ["jar"],
				},
				{
					name: "Resource Pack | Shader Pack",
					extensions: ["zip"],
				},
			],
		});
		if (!file) return;

		toastId = toastLoading({
			title: "Importing File",
		});

		await importFile(profile, file, type);
		await queryClient.invalidateQueries({
			queryKey: ["WORKSHOP_CONTENT", type, profile],
		});

		toastUpdateSuccess(toastId, {
			title: "Content Imported",
		});
	} catch (err) {
		error((err as Error).message);
		if (toastId)
			toastUpdateError(toastId, {
				title: "Import Failed",
				description: "Failed to import content",
				error: err as Error,
			});
	}
}
