import { AlertTriangle, Box, LoaderCircle, Trash2 } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { UpdateIcon } from "@radix-ui/react-icons";
import { ask } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import { useRef } from "react";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TypographyH3, TypographyMuted } from "@/components/ui/typography";
import { uninstallContentByFilename } from "@lib/api/plugins/content";
import { getProjectVersions } from "@lib/api/modrinth/sdk.gen";
import { createToast, updateToast } from "@component/ui/toast";
import type { ContentType } from "@lib/models/download_queue";
import type { Project } from "@/lib/api/modrinth/types.gen";
import type { ContentItem } from "@/lib/models/content";
import type { Profile } from "@/lib/models/profiles";
import { install_known } from "@/lib/system/install";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";

async function uninstall(
	filename: string,
	type: keyof typeof ContentType,
	profile: string,
) {
	try {
		if (!filename) throw new Error("Missing file name");
		await uninstallContentByFilename(type, profile, filename);

		await queryClient.invalidateQueries({
			queryKey: ["WORKSHOP_CONTENT", type, profile],
		});
	} catch (error) {
		console.error(error);
		createToast({
			title: "Failed to uninstall content",
			description: (error as Error).message,
			variant: "error",
		});
	}
}

const checkForUpdate = async (
	profile: Profile,
	project: Project | null,
	item: ContentItem,
) => {
	if (!project) return;
	const toastId = createToast({
		title: "Checking for update.",
		closeButton: false,
		opts: { isLoading: true },
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
				updateToast(toastId, {
					title: "Installing new version",
					variant: "info",
					opts: {
						isLoading: false,
						autoClose: 5000,
					},
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

		updateToast(toastId, {
			title: "Updated to latest version.",
			description: `Lastest version for ${project.title} installed.`,
			variant: "info",
			opts: {
				isLoading: false,
				autoClose: 5000,
			},
		});
	} catch (error) {
		console.error(error);
		updateToast(toastId, {
			title: "Failed to update content",
			description: (error as Error).message,
			variant: "error",
			opts: {
				isLoading: false,
				autoClose: 5000,
			},
		});
	}
};

export const ContentTab: React.FC<{
	profile: Profile;
	content_type: keyof typeof ContentType;
	content: UseQueryResult<
		{
			record: ContentItem;
			project: Project | null;
		}[],
		Error
	>;
}> = ({ profile, content_type, content }) => {
	const { data, error, isError, isLoading } = content;
	const container = useRef<HTMLDivElement>(null);

	const rowVirtualizer = useVirtualizer({
		count: data?.length ?? 0,
		getScrollElement: () => container.current,
		estimateSize: () => 50,
	});

	return (
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
			) : (data?.length ?? 0 >= 1) ? (
				<div
					className="relative w-full"
					style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
				>
					{rowVirtualizer.getVirtualItems().map((virtualItem) => (
						<div
							key={virtualItem.key}
							className="absolute left-0 top-0 inline-flex w-full items-center gap-2 pr-2"
							style={{
								height: `${virtualItem.size}px`,
								transform: `translateY(${virtualItem.start}px)`,
							}}
						>
							<Avatar className="rounded-md">
								<AvatarFallback className="rounded-md">
									<Box />
								</AvatarFallback>
								<AvatarImage
									src={data?.[virtualItem.index].project?.icon_url ?? undefined}
								/>
							</Avatar>
							<div>
								{data?.[virtualItem.index].project ? (
									<Link
										to="/workshop/project/$id"
										params={{ id: data?.[virtualItem.index].project?.id ?? "" }}
										className="-mb-1 line-clamp-1 underline"
									>
										{data?.[virtualItem.index].project?.title}
									</Link>
								) : (
									<h1 className="-mb-1 line-clamp-1">
										{data?.[virtualItem.index].project?.title ??
											data?.[virtualItem.index].record?.file_name}
									</h1>
								)}
								<TypographyMuted>
									{data?.[virtualItem.index].record?.version ??
										data?.[virtualItem.index].record?.file_name ??
										"Unknown"}
								</TypographyMuted>
							</div>
							<div className="ml-auto">
								{data?.[virtualItem.index].project?.id ? (
									<Button
										onClick={async () =>
											checkForUpdate(
												profile,
												data[virtualItem.index].project,
												data[virtualItem.index].record,
											)
										}
										title="Check for update"
										variant="ghost"
										className="mr-2 h-5 w-5"
										size="icon"
									>
										<UpdateIcon className="h-5 w-5 hover:animate-spin" />
									</Button>
								) : null}
								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button
											variant="destructive"
											size="icon"
											title="Delete Mod"
										>
											<Trash2 className="h-5 w-5" />
										</Button>
									</AlertDialogTrigger>
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
													const filename =
														data?.[virtualItem.index].record?.file_name;
													if (filename) {
														uninstall(filename, content_type, profile.id);
													}
												}}
											>
												Ok
											</AlertDialogAction>
										</AlertDialogFooter>
									</AlertDialogContent>
								</AlertDialog>
							</div>
						</div>
					))}
				</div>
			) : (
				<div className="w-full h-full flex-1 flex flex-col justify-center items-center">
					No content installed
				</div>
			)}
		</div>
	);
};
