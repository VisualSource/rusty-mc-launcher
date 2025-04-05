import { useQuery } from "@tanstack/react-query";
import { Anvil } from "lucide-react";
import { compare } from "semver";

import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	getProjectVersions,
} from "@/lib/api/modrinth/sdk.gen";
import { Button } from "@/components/ui/button";
import { ask, message } from "@tauri-apps/plugin-dialog";
import { toastError } from "@/lib/toast";
import { QueueItem } from "@/lib/models/download_queue";
import type { Profile } from "@/lib/models/profiles";

export const UpdateModpackCheck: React.FC<{
	profile: Profile
}> = ({ profile }) => {
	const { data } = useQuery({
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
		initialData: { hasUpdate: false, nextVersionData: null },
		queryKey: ["MODPACK_PACK_METADATA", profile.is_modpack],
		queryFn: async () => {
			if (!profile.is_modpack) throw new Error("No modpack metadata was provided");

			const content = JSON.parse(profile.is_modpack) as {
				version_type: string,
				version: string,
				project_id: string | null,
			};

			switch (content.version_type) {
				case "curseforge_semver": {
					return { hasUpdate: false, nextVersionData: null };
				}
				case "modrinth_id": {
					if (!content?.project_id) return { hasUpdate: false, nextVersionData: null };

					const { data: versions, error, } = await getProjectVersions({
						path: {
							"id|slug": content.project_id,
						},
						query: {
							game_versions: JSON.stringify([profile.version]),
							loaders: JSON.stringify([profile.loader])
						}
					});
					if (error) throw error;
					const version = versions?.at(0);
					if (!version || !version?.version_number) throw new Error("Failed to get lastest version for modpack");

					const hasUpdate = compare(content.version, version.version_number) === -1;
					return { hasUpdate: hasUpdate, nextVersionData: hasUpdate ? version : null };
				}

				default:
					throw new Error(`Unknown modpack metadat type: Given ${content.version_type}`);
			}
		},
	});

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<div className="relative">
					{data.hasUpdate ? (
						<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2 animate-pulse" />
					) : null}
					<Button variant="secondary" size="icon" onClick={() => {
						if (!data.hasUpdate) {
							message("Your modpack is all up to date", { title: "Modpack Updater", kind: "info" }).catch(e => console.error(e));
							return;
						}
						ask(`Version ${data.nextVersionData?.version_number} is available. Do you want to update?`, { title: "Modpack Updater", kind: "info" })
							.then(async (shouldUpdate) => {
								if (!shouldUpdate) return;

								const file = data.nextVersionData?.files.find(e => e.primary);
								if (!file) throw new Error("Failed to get primary file!", { cause: data.nextVersionData });

								await QueueItem.insert({
									content_type: "Update",
									profile_id: profile.id,
									display_name: `${profile.name}: Update ${data.nextVersionData?.version_number}`,
									icon: profile.icon,
									priority: 1,
									metadata: {
										content_type: "MODPACK",
										files: [
											{
												sha1: file?.hashes.sha1,
												url: file?.url,
												id: data.nextVersionData?.id,
												filename: file?.filename,
												version: data.nextVersionData?.version_number,
											},
										],
									},
								});

							}).catch(e => {
								toastError({ error: e as Error, title: "Updater failed", description: "Failed to update modpack" })
								console.error(e);
							})
					}}>
						<Anvil />
					</Button>
				</div>
			</TooltipTrigger>
			<TooltipContent>
				<p>{data.hasUpdate ? `Modpack ${data.nextVersionData?.version_number} is available!` : "Modpack Update"}</p>
			</TooltipContent>
		</Tooltip>
	);
};
