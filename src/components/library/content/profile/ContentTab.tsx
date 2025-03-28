import type { UseQueryResult } from "@tanstack/react-query";
import { AlertTriangle, LoaderCircle } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useRef, useState } from "react";
import { ask } from "@tauri-apps/plugin-dialog";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toastLoading, toastUpdateError, toastUpdateInfo, toastUpdateSuccess } from "@/lib/toast";
import { uninstallContentByFilename } from "@lib/api/plugins/content";
import { getProjectVersions } from "@lib/api/modrinth/sdk.gen";
import type { ContentType } from "@lib/models/download_queue";
import type { Project } from "@/lib/api/modrinth/types.gen";
import { TypographyH3 } from "@/components/ui/typography";
import type { ContentItem } from "@/lib/models/content";
import type { Profile } from "@/lib/models/profiles";
import { install_known } from "@/lib/system/install";
import { queryClient } from "@/lib/api/queryClient";
import { ContentListItem } from "./ContentListItem";

async function uninstall(
	filename: string,
	type: keyof typeof ContentType,
	profile: string,
) {
	const toastId = toastLoading({ title: "Removing content" });
	try {
		if (!filename) throw new Error("Missing file name");
		await uninstallContentByFilename(type, profile, filename);
		await queryClient.invalidateQueries({
			queryKey: ["WORKSHOP_CONTENT", type, profile],
		});

		toastUpdateSuccess(toastId, { title: "Removed content" });

	} catch (error) {
		console.error(error);

		toastUpdateError(toastId, {
			title: "Removal failed",
			description: "Failed to remove content",
			error: error as Error
		});

	}
}

const checkForUpdate = async (
	profile: Profile,
	project: Project | null,
	item: ContentItem,
) => {
	if (!project) return;
	const toastId = toastLoading({
		title: "Checking for update."
	});
	try {
		const { data, error, response } = await getProjectVersions({
			path: {
				"id|slug": project.id,
			},
			query: {
				game_versions: `["${profile.version}"]`,
				loaders:
					profile.loader !== "vanilla" ? `["${profile.loader}"]` : undefined,
			},
		});
		if (error) throw error;
		if (!data || !response.ok)
			throw new Error("Failed to load project versions", { cause: response });

		const version = data.at(0);
		const currentInstalledVersion = item.version;

		if (!version?.version_number?.length) {
			throw new Error("No latest version could be found");
		}
		if (version.version_number !== currentInstalledVersion) {
			const doUpdate = await ask(
				`Would you like to update ${project.title} to version "${version.version_number}" currently installed is "${item.version}"`,
				{
					title: "Update Avaliable",
					cancelLabel: "No",
					okLabel: "Update",
					kind: "info",
				},
			);

			if (doUpdate) {
				toastUpdateInfo(toastId, {
					title: "Installing new version",
				});
				await install_known(
					version,
					{
						title: project.title ?? "Unknown content name",
						type: project.project_type,
						icon: project?.icon_url,
					},
					profile,
				);
			}
			return;
		}


		toastUpdateInfo(toastId, {
			title: "Updated to latest version.",
			description: `Lastest version for ${project.title} installed.`,
		});
	} catch (error) {
		console.error(error);
		toastUpdateError(toastId, {
			title: "Failed to update content",
			description: (error as Error).message,
			error: error as Error
		});
	}
};

export const ContentTab: React.FC<{
	profile: Profile;
	isModpack: boolean,
	content_type: keyof typeof ContentType;
	content: UseQueryResult<
		{
			record: ContentItem;
			project: Project | null;
		}[],
		Error
	>;
}> = ({ profile, content_type, content, isModpack }) => {
	const [showUninstall, setShowUninstall] = useState<null | number>(null);
	const { data, error, isError, isLoading } = content;
	const container = useRef<HTMLDivElement>(null);

	const updateCheck = useCallback((record: ContentItem, project: Project | null) => checkForUpdate(profile, project, record), [profile]);

	const rowVirtualizer = useVirtualizer({
		count: data?.length ?? 0,
		getScrollElement: () => container.current,
		estimateSize: () => 50,
	});

	return (
		<>
			<AlertDialog open={showUninstall !== null} onOpenChange={() => setShowUninstall(null)}>
				<AlertDialogContent className="text-white">
					<AlertDialogHeader>
						<AlertDialogTitle>
							Are you absolutely sure?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This action will delete this content, and can not be
							undone. Deleting this may also break this install if
							this content is a dependency of other content that is
							installed.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (!showUninstall) return;
								const item = data?.at(showUninstall);
								if (!item) return;

								const filename = item.record.file_name;
								uninstall(filename, content_type, profile.id)
							}}
						>
							Ok
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
			<div ref={container} className="h-full overflow-y-auto scrollbar">
				{isLoading ? (
					<div className="flex h-full w-full flex-col items-center justify-center">
						<div className="flex gap-2">
							<LoaderCircle className="animate-spin" />
							<pre>Loading Content</pre>
						</div>
					</div>
				) : isError ? (
					<div className="flex h-full flex-col items-center justify-center text-zinc-50">
						<AlertTriangle />
						<TypographyH3>Something went wrong:</TypographyH3>
						<pre className="text-red-300">{error.message}</pre>
					</div>
				) : (data && (data?.length ?? 0 >= 1)) ? (
					<div
						className="relative w-full"
						style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
					>
						{rowVirtualizer.getVirtualItems().map((virtualItem) => (
							<ContentListItem
								isModpack={isModpack}
								uninstall={setShowUninstall}
								key={virtualItem.key}
								data={data[virtualItem.index]}
								item={virtualItem}
								checkForUpdate={updateCheck}
							/>
						))}
					</div>
				) : (
					<div className="w-full h-full flex-1 flex flex-col justify-center items-center">
						No content installed
					</div>
				)}
			</div>
		</>
	);
};
