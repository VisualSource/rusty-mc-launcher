import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { open } from "@tauri-apps/plugin-dialog";
import { toast } from "react-toastify";
import { Import } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentTab } from "@/components/library/content/profile/ContentTab";

import { profileQueryOptions } from "../_profile.$id";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import logger from "@system/logger";
import { ContentItem } from "@/lib/models/content";
import { query } from "@lib/api/plugins/query";
import { manualContentImport } from "@lib/api/plugins/content";
import {
	getProjects,
	versionsFromHashes,
} from "@/lib/api/modrinth/services.gen";
import { modrinthClient } from "@/lib/api/modrinthClient";

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/",
)({
	component: ProfileContent,
	pendingComponent: Loading,
});

function ProfileContent() {
	const [selected, setSelected] = useState<"Mod" | "Resourcepack" | "Shader">(
		"Mod",
	);
	const params = Route.useParams();
	const profile = useSuspenseQuery(profileQueryOptions(params.id));
	const content = useQuery({
		enabled: !!profile.data,
		queryKey: ["WORKSHOP_CONTENT", selected, profile.data.id],
		queryFn: async () => {
			const data = await query(
				"SELECT * FROM profile_content WHERE profile = ? AND type = ?;",
				[profile.data.id, selected],
			)
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
						await query(
							"UPDATE profile_content SET id = ?, version = ? WHERE file_name = ? AND type = ? AND profile = ? AND sha1 = ?",
							[
								project.id,
								projectId.version.version_number,
								content.file_name,
								content.type,
								content.profile,
								content.sha1,
							],
						).run();
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
		},
	});

	return (
		<div className="h-full space-y-4 overflow-hidden rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
			<Tabs
				value={selected}
				onValueChange={(e) =>
					setSelected(e as "Mod" | "Resourcepack" | "Shader")
				}
				className="flex h-full w-full flex-col"
			>
				<TabsList className="w-full">
					<TabsTrigger value="Mod">Mods</TabsTrigger>
					<TabsTrigger value="Resourcepack">Resource Packs</TabsTrigger>
					<TabsTrigger value="Shader">Shader Packs</TabsTrigger>
				</TabsList>
				<div className="mt-4 flex justify-between">
					<div>
						<span>{content.data?.length ?? 0} Items</span>
					</div>
					<Button
						variant="secondary"
						size="sm"
						onClick={async () => {
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
							if (!file || Array.isArray(file)) return;

							const id = toast.loading("Importing Content");
							try {
								await manualContentImport(selected, profile.data.id, file);
								await queryClient.invalidateQueries({
									queryKey: ["WORKSHOP_CONTENT", selected, profile.data.id],
								});
								toast.update(id, {
									render: "Imported Content",
									type: "success",
									isLoading: false,
									autoClose: 5000,
								});
							} catch (error) {
								console.error(error);
								logger.error((error as Error).message);
								toast.update(id, {
									render: "Failed to import content",
									type: "error",
									isLoading: false,
									autoClose: 5000,
								});
							}
						}}
					>
						<Import className="h-4 w-4 mr-2" />
						Import External
					</Button>
				</div>
				<div className="pb-2 overflow-y-auto scrollbar h-full">
					<ContentTab
						content_type={selected}
						profile={profile.data}
						content={content}
					/>
				</div>
			</Tabs>
		</div>
	);
}
