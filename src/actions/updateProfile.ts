import type { ActionFunction } from "react-router-dom";

import { UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { queryClient } from "@/lib/config/queryClient";
import { CATEGORY_KEY } from "@/hooks/keys";
import logger from "@lib/system/logger";
import { createProfile, db } from "@system/commands";

const updateProfile: ActionFunction = async ({ request }) => {
	const data = (await request.json()) as MinecraftProfile;

	switch (request.method.toUpperCase()) {
		case "POST": {
			try {
				const queue_id = crypto.randomUUID();

				let version = data.version;
				if (data.version === "latest-release") {
					const latest_data = (await fetch(
						"https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
					).then((e) => e.json())) as {
						latest: { release: string; snapshot: string };
					};
					version = latest_data.latest.release;
				}

				await db.execute({
					query: `
          BEGIN TRANSACTION;
            INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
            INSERT INTO download_queue VALUES (?,?,
              (SELECT COUNT(*) as count FROM download_queue WHERE state = 'PENDING'),
              ?,?,?,?,?,?,?);
          COMMIT;
        `,
					args: [
						data.id,
						data.name,
						data.icon ?? null,
						data.date_created,
						data.last_played ?? null,
						version,
						data.loader,
						data.loader_version ?? null,
						data.java_args ?? null,
						data.resolution_width ?? null,
						data.resolution_height ?? null,
						"INSTALLING",
						queue_id,
						1,
						`Minecraft ${version} ${data.loader}`,
						null,
						data.id,
						new Date().toISOString(),
						"Client",
						JSON.stringify({
							version: version,
							loader: data.loader.replace(/^\w/, data.loader[0].toUpperCase()),
							loader_version: data.loader_version,
						}),
						"PENDING",
					],
				});

				await createProfile(data.id);

				await queryClient.invalidateQueries({
					queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID],
				});
			} catch (error) {
				logger.error(error);
			}

			break;
		}
		default:
			throw new Error("Unsupported action");
	}

	return new Response(null, {
		status: 302,
		headers: {
			Location: `/profile/${data.id}`,
		},
	});
};

export default updateProfile;
