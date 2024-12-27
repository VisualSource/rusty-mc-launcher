import { coerce, minSatisfying } from "semver";
import toast, { updateToast } from "@component/ui/toast";

import type {
	Project,
	Version,
	VersionDependency,
	VersionFile,
} from "../api/modrinth/types.gen";
import {
	getProjectVersions,
	getVersion,
	getProject,
} from "../api/modrinth/services.gen";
import {
	uninstallContentByFilename,
	uninstallContentById,
} from "@lib/api/plugins/content";
import { selectProfile } from "@/components/dialog/ProfileSelection";
import { ContentType } from "@lib/models/download_queue";
import { modrinthClient } from "../api/modrinthClient";
import { askFor } from "@/components/dialog/AskDialog";
import { QueueItem } from "../models/download_queue";
import { QueueItemState } from "../QueueItemState";
import type { Profile } from "../models/profiles";
import { ContentItem } from "../models/content";
import { query } from "@lib/api/plugins/query";

function asContentType(value: string): keyof typeof ContentType {
	return value.replace(
		/^\w/,
		value[0].toUpperCase(),
	) as keyof typeof ContentType;
}

async function getContentVersion(
	current: VersionDependency,
	loaders?: string,
	game?: string,
): Promise<Version> {
	if (current.project_id) {
		const versions = await getProjectVersions({
			client: modrinthClient,
			path: {
				"id|slug": current.project_id,
			},
			query: {
				game_versions: game,
				loaders,
			},
		});
		if (versions.error) throw versions.error;
		if (!versions.data) throw new Error("Failed to load project versions");

		const version = versions.data.at(0);
		if (!version) throw new Error("Failed to get verison");

		return version;
	}
	if (current.version_id) {
		const version = await getVersion({
			client: modrinthClient,
			path: {
				id: current.version_id,
			},
		});
		if (version.error) throw version.error;
		if (!version.data) throw new Error("Failed to load version");
		return version.data;
	}

	throw new Error("Failed to get dependency version", { cause: current });
}

type Dep =
	| { type: "incompatible"; dep: VersionDependency }
	| { type: "include"; file: VersionFile; version: string; id: string };
async function* getDependencies(
	deps: VersionDependency[],
	profile: string,
	loaders?: string,
	game?: string,
): AsyncGenerator<Dep, null, unknown> {
	const deps_to_install = deps;

	while (deps_to_install.length) {
		const current = deps_to_install.shift();
		if (!current) continue;

		const version = await getContentVersion(current, loaders, game);
		const file = version.files.find((e) => e.primary) ?? version.files.at(0);
		if (!file) throw new Error("Missing file download");

		if (current.dependency_type === "incompatible") {
			const incompatible =
				await query`SELECT * FROM profile_content WHERE id = ${version.project_id} AND profile = ${profile} LIMIT 1;`
					.as(ContentItem)
					.get();

			if (incompatible) {
				yield { type: "incompatible", dep: current };
			}
			continue;
		}

		if (current.dependency_type === "optional") {
			const project = await getProject({
				client: modrinthClient,
				path: {
					"id|slug": version.project_id,
				},
			});
			if (project.error) throw project.error;
			if (!project.data) throw new Error("Failed load project");

			const result = await askFor({
				title: "Optional Dependencies",
				description: "Install optional dependencies",
				multi: true,
				empty: "There are no optional dependencies.",
				options: [
					{
						id: version.project_id,
						name: project.data.title ?? "Unname project",
						icon: project.data.icon_url ?? undefined,
					},
				],
			});
			if (!result.at(0)?.value) {
				continue;
			}
		}

		if (version.dependencies?.length) {
			deps_to_install.push(...version.dependencies);
		}

		if (!version.version_number) throw new Error("Dep missing version number");
		yield {
			type: "include",
			file,
			version: version.version_number,
			id: version.project_id,
		};
	}

	return null;
}

function getClosestVersion(
	override: boolean,
	target: string,
	versions: string[],
) {
	if (override || !target.includes(".")) {
		return [target];
	}
	const t = coerce(target);
	if (!t) return [target];

	const id = minSatisfying(versions, `${t.major}.${t.minor}.x`);
	return [id ?? target];
}

export async function install_known(
	version: Version,
	project: {
		title: string;
		type: "shader" | "mod" | "modpack" | "resourcepack";
		icon?: string | null;
	},
	profile: Profile,
) {
	if (project.type === "modpack")
		throw new Error("Known modpack install is not supported!");

	const file = version.files.find((e) => e.primary) ?? version.files.at(0);
	if (!file) throw new Error("No file download was found");

	await uninstallContentByFilename(
		asContentType(project.type),
		profile.id,
		file.filename,
	);

	const files = [
		{
			sha1: file?.hashes.sha1,
			url: decodeURIComponent(file?.url),
			filename: decodeURIComponent(file.filename),
			version: version.version_number,
			id: version.project_id,
		},
	];

	switch (project.type) {
		case "mod": {
			if (!version.dependencies?.length) break;
			for await (const dep of getDependencies(
				version.dependencies,
				profile.id,
				JSON.stringify([profile.loader]),
				JSON.stringify([profile.version]),
			)) {
				switch (dep.type) {
					case "incompatible":
						throw new Error("Incompatible with current install", {
							cause: dep.dep,
						});
					case "include": {
						if (!dep.file) throw new Error("Missing file download");

						await uninstallContentByFilename(
							asContentType(dep.type),
							profile.id,
							file.filename,
						);

						files.push({
							sha1: dep.file?.hashes.sha1,
							url: decodeURIComponent(dep.file?.url),
							id: dep.id,
							filename: decodeURIComponent(dep.file?.filename),
							version: dep.version,
						});
						break;
					}
					default:
						break;
				}
			}
			break;
		}
	}

	const content_id = project.type.replace(
		/^\w/,
		project.type[0].toUpperCase(),
	) as keyof typeof ContentType;
	const queue_id = crypto.randomUUID();

	await QueueItem.insert({
		id: queue_id,
		display: true,
		priority: 0,
		display_name: project.title,
		icon: project.icon ?? null,
		profile_id: profile.id,
		content_type: content_id,
		state: "PENDING",
		created: new Date().toISOString(),
		metadata: {
			content_type: content_id,
			profile: profile.id,
			files: files,
		},
	});
}

export async function install(data: Project) {
	const id = toast({
		title: "Preparing install...",
		closeButton: false,
		opts: { isLoading: true },
	});
	try {
		switch (data.project_type) {
			case "resourcepack":
			case "shader": {
				const profile = await selectProfile({
					game: data.game_versions,
					loaders: data.loaders,
				});
				if (!profile) {
					updateToast(id, {
						data: { variant: "info", title: "Install canceled" },
						isLoading: false,
						autoClose: 5000,
					});
					return;
				}

				const versions = await getProjectVersions({
					client: modrinthClient,
					path: {
						"id|slug": data.id,
					},
				});
				if (versions.error) throw versions.error;
				if (!versions.data) throw new Error("Failed to project versions");
				const version = versions.data.at(0);
				if (!version) throw new Error("No versions are available");

				const file =
					version.files.find((e) => e.primary) ?? version.files.at(0);
				if (!file) throw new Error("No file download was found");

				await uninstallContentById(
					asContentType(data.project_type),
					profile.id,
					data.id,
				);

				const files = [
					{
						sha1: file?.hashes.sha1,
						url: decodeURIComponent(file?.url),
						filename: file.filename,
						version: version.version_number,
						id: data.id,
					},
				];
				const content_id = data.project_type.replace(
					/^\w/,
					data.project_type[0].toUpperCase(),
				) as keyof typeof ContentType;
				const queue_id = crypto.randomUUID();

				await QueueItem.insert({
					id: queue_id,
					display: true,
					priority: 0,
					display_name: data.title ?? "Unknown",
					icon: data.icon_url ?? null,
					profile_id: profile.id,
					content_type: content_id,
					created: new Date().toISOString(),
					state: QueueItemState.PENDING,
					metadata: {
						content_type: content_id,
						profile: profile.id,
						files: files,
					},
				});

				break;
			}
			case "mod": {
				const profile = await selectProfile({
					game: data.game_versions,
					loaders: data.loaders,
				});
				if (!profile) {
					updateToast(id, {
						data: { variant: "info", title: "Install canceled" },
						isLoading: false,
						autoClose: 5000,
					});
					return;
				}

				const target = getClosestVersion(
					data.game_versions?.includes(profile.version) ?? false,
					profile.version,
					data.game_versions ?? [],
				);

				const loaders = JSON.stringify([profile.loader]);
				const gameVersions = JSON.stringify(target);
				const versions = await getProjectVersions({
					client: modrinthClient,
					path: {
						"id|slug": data.id,
					},
					query: {
						loaders,
						game_versions: gameVersions,
					},
				});
				if (versions.error) throw versions.error;
				if (!versions.data) throw new Error("Failed to load project versions");
				const version = versions.data.at(0);
				if (!version) throw new Error("No versions are avaiable");

				const file =
					version.files.find((e) => e.primary) ?? version.files.at(0);
				if (!file) throw new Error("No file download was found");

				await uninstallContentByFilename(
					asContentType(data.project_type),
					profile.id,
					file.filename,
				);

				const files = [
					{
						sha1: file?.hashes.sha1,
						url: decodeURIComponent(file?.url),
						filename: file.filename,
						version: version.version_number,
						id: data.id,
					},
				];
				if (version.dependencies?.length) {
					for await (const dep of getDependencies(
						version.dependencies,
						profile.id,
						loaders,
						gameVersions,
					)) {
						switch (dep.type) {
							case "incompatible":
								throw new Error("Incompatible with current install", {
									cause: dep.dep,
								});
							case "include": {
								if (!dep.file) throw new Error("Missing file download");

								await uninstallContentByFilename(
									asContentType(data.project_type),
									profile.id,
									dep.file.filename,
								);

								files.push({
									sha1: dep.file?.hashes.sha1,
									url: decodeURIComponent(dep.file?.url),
									id: dep.id,
									filename: dep.file?.filename,
									version: dep.version,
								});
								break;
							}
							default:
								break;
						}
					}
				}

				const content_id = data.project_type.replace(
					/^\w/,
					data.project_type[0].toUpperCase(),
				) as keyof typeof ContentType;
				const queue_id = crypto.randomUUID();

				await QueueItem.insert({
					id: queue_id,
					display: true,
					priority: 0,
					display_name: data.title ?? "Unknown",
					icon: data.icon_url ?? null,
					profile_id: profile.id,
					content_type: content_id,
					created: new Date().toISOString(),
					state: QueueItemState.PENDING,
					metadata: {
						content_type: content_id,
						profile: profile.id,
						files: files,
					},
				});

				break;
			}
			case "modpack": {
				const gameVersions = await askFor({
					title: "Select game version",
					description: "Select the game version to use",
					empty: "No versions found",
					options:
						data.game_versions?.map((e) => ({ id: e, name: e })).toReversed() ??
						[],
					multi: false,
				});

				if (!gameVersions.length) {
					updateToast(id, {
						data: { variant: "info", title: "Install canceled" },
						isLoading: false,
						autoClose: 5000,
					});
					return;
				}

				const loaders = await askFor({
					title: "Select Modloader",
					description: "Select the modloader to use",
					empty: "No loaders found",
					multi: false,
					options: data.loaders?.map((e) => ({ id: e, name: e })) ?? [],
				});
				if (!loaders.length) {
					updateToast(id, {
						data: { variant: "info", title: "Install canceled" },
						isLoading: false,
						autoClose: 5000,
					});
					return;
				}

				const version_data = await getProjectVersions({
					client: modrinthClient,
					path: {
						"id|slug": data.id,
					},
					query: {
						loaders: JSON.stringify(loaders.map((e) => e.id)),
						game_versions: JSON.stringify(gameVersions.map((e) => e.id)),
					},
				});
				if (version_data.error) throw version_data.error;
				if (!version_data.data)
					throw new Error("Failed to get project versions");

				const version = version_data.data.at(0);
				if (!version) return;

				const file =
					version.files.find((e) => e.primary) ?? version.files.at(0);
				if (!version) return;

				const queue_id = crypto.randomUUID();
				const profile = crypto.randomUUID();

				await QueueItem.insert({
					id: queue_id,
					display: true,
					priority: 0,
					display_name: data.title ?? "Unknown",
					icon: data.icon_url ?? null,
					profile_id: profile,
					content_type: ContentType.Modpack,
					created: new Date().toISOString(),
					state: QueueItemState.PENDING,
					metadata: {
						content_type: ContentType.Modpack,
						profile,
						files: [
							{
								sha1: file?.hashes.sha1,
								url: file?.url,
								id: data.id,
								filename: file?.filename,
								version: version.version_number,
							},
						],
					},
				});
				break;
			}
			default:
				break;
		}

		updateToast(id, {
			data: { variant: "success", title: "Staring Install" },
			isLoading: false,
			autoClose: 5000,
		});
	} catch (error) {
		console.error(error);
		updateToast(id, {
			data: { variant: "success", error, title: "Failed to install content" },
			isLoading: false,
			autoClose: 5000,
		});
	}
}
