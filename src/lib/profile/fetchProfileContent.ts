import { getProjects, versionsFromHashes } from "../api/modrinth/services.gen";
import type { ContentType } from "../models/download_queue";
import { modrinthClient } from "../api/modrinthClient";
import { ContentItem } from "../models/content";
import { query } from "../api/plugins/query";

export async function fetchProfileContent(
	profileId: string,
	contentType: keyof typeof ContentType,
) {
	const data =
		await query`SELECT * FROM profile_content WHERE profile = ${profileId} AND type = ${contentType};`
			.as(ContentItem)
			.all();

	const { unknownContent, hashesContent, idsContent } = data.reduce(
		(prev, cur) => {
			if (cur.id.length) {
				prev.idsContent.push(cur);
			} else if (cur.sha1) {
				prev.hashesContent.push(cur);
			} else {
				prev.unknownContent.push(cur);
			}
			return prev;
		},
		{ unknownContent: [], hashesContent: [], idsContent: [] } as {
			unknownContent: typeof data;
			hashesContent: typeof data;
			idsContent: typeof data;
		},
	);

	const loadIdContent = async () => {
		const ids = JSON.stringify(idsContent.map((e) => e.id));
		const projects = await getProjects({
			client: modrinthClient,
			query: {
				ids,
			},
		});
		if (projects.error) throw projects.error;
		if (!projects.data) throw new Error("Failed to load projects.");
		return idsContent.map((item) => {
			const project = projects.data.find((e) => e.id === item.id);
			return { record: item, project: project ?? null };
		});
	};

	const loadHashContent = async () => {
		const hashes = await versionsFromHashes({
			client: modrinthClient,
			body: {
				algorithm: "sha1",
				hashes: hashesContent.map((e) => e.sha1),
			},
		});
		if (hashes.error) throw hashes.error;
		if (!hashes.data) throw new Error("Failed to load versions from hashs");

		const items = Object.entries(hashes.data).map(([hash, version]) => ({
			hash,
			version,
		}));

		const projects = await getProjects({
			client: modrinthClient,
			query: {
				ids: JSON.stringify(items.map((e) => e.version.project_id)),
			},
		});
		if (projects.error) throw projects.error;
		if (!projects.data) throw new Error("Failed to load projects");

		const output = [];
		for (const content of hashesContent) {
			const projectId = items.find((e) => e.hash === content.sha1);
			if (!projectId) {
				output.push({ record: content, project: null });
				continue;
			}

			const project = projects.data.find(
				(e) => e.id === projectId.version.project_id,
			);
			if (!project) {
				output.push({ record: content, project: null });
				continue;
			}

			if (!content.id.length) {
				await query`UPDATE profile_content SET id = ${project.id}, version = ${projectId.version.version_number} WHERE file_name = ${content.file_name} AND type = ${content.type} AND profile = ${content.profile} AND sha1 = ${content.sha1}`.run();
				content.version = projectId.version.version_number ?? null;
			}
			output.push({ record: content, project });
		}

		return output;
	};
	const c = async () => {
		return unknownContent.map((e) => ({ record: e, project: null }));
	};

	const results = await Promise.allSettled([
		loadIdContent(),
		loadHashContent(),
		c(),
	]);
	return results
		.map((e) => (e.status === "fulfilled" ? e.value : null))
		.filter(Boolean)
		.flat(2);
}
