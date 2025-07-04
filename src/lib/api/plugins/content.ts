import { invoke, type Channel } from "@tauri-apps/api/core";
import type { z } from "zod";
import {
	getCategoriesFromProfile,
	UNCATEGORIZEDP_GUID,
} from "@/lib/models/categories";
import { ContentType } from "@/lib/models/download_queue";
import type { Profile } from "@/lib/models/profiles";
import { bulk, query, transaction } from "./query";
import { queryClient } from "../queryClient";
import { CATEGORIES_KEY, CATEGORY_KEY } from "@/hooks/keys";
import { exists } from "@tauri-apps/plugin-fs";

export type DownloadCurrentItem = {
	display_name: string;
	icon: string | null;
	content_type: keyof typeof ContentType;
	profile: string;
};
export type DownloadEvent =
	| {
		event: "init";
		data: DownloadCurrentItem;
	}
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
	| { event: "finished"; data: unknown }
	| { event: "refreshProfile" }
	| { event: "toast", data: { status: string; message: string } }
	| { event: "invalidateQuery", data: { query_key: string[] } };

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

export async function uninstallContentById(
	contentType: keyof typeof ContentType,
	profileId: string,
	contentId: string,
) {
	await query`DELETE FROM profile_content WHERE profile = ${profileId} AND id = ${contentId} AND type = ${contentType}`.get();
}

export async function uninstallContentByFilename(
	contentType: keyof typeof ContentType,
	profileId: string,
	filename: string,
) {
	await query`DELETE FROM profile_content WHERE profile = ${profileId} AND file_name = ${filename} AND type = ${contentType}`.run();
	await invoke<void>("plugin:rmcl-content|uninstall_content", {
		content: contentType,
		filename,
		profile: profileId,
	});
}

/**
 *
 * @param args
 * @param copy path to options.txt
 */
export async function createProfile(
	args: z.infer<typeof Profile.schema>,
	copy?: string,
) {
	if (copy) {
		const doesFileExist = await exists(copy);
		if (!doesFileExist) throw new Error(`File at "${copy}" does not exist!`);
	}

	const queueId = crypto.randomUUID();
	await invoke<void>("plugin:rmcl-content|create_profile", {
		profile: args.id,
		copy_from: copy,
	});
	await transaction((tx) => {
		tx`INSERT INTO profiles (id,name,icon,date_created,version,loader,loader_version,java_args,resolution_width,resolution_height) VALUES (${args.id},${args.name},${args.icon},${args.date_created},${args.version},${args.loader},${args.loader_version},${args.java_args},${args.resolution_width},${args.resolution_height});`;
		tx`INSERT INTO download_queue (id,priority,display_name,profile_id,content_type,metadata) VALUES (${queueId},1,${`Minecraft ${args.loader} ${args.version}`},${args.id},${ContentType.Client},${JSON.stringify(
			{
				version: args.version,
				loader: args.loader.replace(/^\w/, args.loader[0].toUpperCase()),
				loader_version: args.loader_version,
			},
		)});`;
	});
}

export async function copyProfile(oldProfile: Profile, newProfile: string) {
	await transaction((tx) => {
		tx`INSERT INTO profiles VALUES (
			${newProfile},
			${`${oldProfile.name}: Duplicate`},
			${oldProfile.icon},
			${new Date().toISOString()},
			${null},
			${oldProfile.version},
			${oldProfile.loader},
			${oldProfile.loader_version},
			${oldProfile.java_args},
			${oldProfile.resolution_width},
			${oldProfile.resolution_height},
			${oldProfile.state},
			${oldProfile.is_modpack});`;
		tx`CREATE TEMPORARY TABLE copy_profile_row AS SELECT * FROM profile_content WHERE profile = ${oldProfile.id};`;
		tx`UPDATE copy_profile_row SET profile = ${newProfile};`
		tx`INSERT INTO profile_content SELECT * FROM copy_profile_row;`;
		tx`DROP TABLE copy_profile_row;`;
	});

	await invoke<void>("plugin:rmcl-content|copy_profile", {
		oldProfile: oldProfile.id,
		newProfile: newProfile,
	});

	await queryClient.invalidateQueries({
		queryKey: [CATEGORY_KEY],
	});
}

export async function deleteProfile(profileId: string) {
	const cats = await getCategoriesFromProfile(profileId);

	await query`DELETE FROM profiles WHERE id = ${profileId}`.run();

	for (const cat of cats) {
		await queryClient.invalidateQueries({
			queryKey: [CATEGORY_KEY, cat.category],
		});
	}
	// remote local files
	await invoke<void>("plugin:rmcl-content|delete_profile", {
		profile: profileId,
	});
}

export async function importFile(
	profile: string,
	src: string,
	type: keyof typeof ContentType,
) {
	return invoke<void>("plugin:rmcl-content|import_external", {
		profile,
		src,
		content_type: type,
	});
}
