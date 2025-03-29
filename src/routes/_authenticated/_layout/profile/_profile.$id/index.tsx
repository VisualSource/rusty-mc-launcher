import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Import, LockOpen } from "lucide-react";
import { memo, useState } from "react";

import { AlertDialog, AlertDialogCancel, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ContentTab } from "@/components/library/content/profile/ContentTab";
import { fetchProfileContent } from "@/lib/profile/fetchProfileContent";
import { profileImportFile } from "@/lib/profile/profileImportFile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toastError, toastSuccess } from "@/lib/toast";
import { profileQueryOptions } from "../_profile.$id";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/api/queryClient";
import { query } from "@/lib/api/plugins/query";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { KEY_PROFILE } from "@/hooks/keys";

const unlockModpack = async (id: string) => {
	try {
		await query`UPDATE profiles SET is_modpack = NULL WHERE id = ${id}`.run();
		await queryClient.invalidateQueries({ queryKey: [KEY_PROFILE, id] });
		toastSuccess({ title: "Profile unlocked", description: "Profile was been unlocked" });
	} catch (error) {
		console.error(error);
		toastError({ title: "Unlock failed", description: "Failed to unlock profile", error: error as Error });
	}
}

const MemoedProfileContent = memo(ProfileContent);
export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/",
)({
	component: MemoedProfileContent,
	pendingComponent: Loading,
});

function ProfileContent() {
	const params = Route.useParams();
	const profile = useSuspenseQuery(profileQueryOptions(params.id));
	const isModpack = (profile.data.is_modpack?.length ?? 0) > 1;
	const isModded = profile.data.loader !== "vanilla";

	const [selected, setSelected] = useState<"Mod" | "Resourcepack" | "Shader">(
		isModded ? "Mod" : "Resourcepack",
	);
	const content = useQuery({
		enabled: !!profile.data,
		queryKey: ["WORKSHOP_CONTENT", selected, profile.data.id],
		queryFn: () => fetchProfileContent(profile.data.id, selected),
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
					{isModded ? <TabsTrigger value="Mod">Mods</TabsTrigger> : null}
					<TabsTrigger value="Resourcepack">Resource Packs</TabsTrigger>
					{isModded ? (
						<TabsTrigger value="Shader">Shader Packs</TabsTrigger>
					) : null}
				</TabsList>
				<div className="mt-2 flex justify-between relative">
					<div className="flex flex-col justify-center ml-1">
						<div className="font-thin">{content.data?.length ?? 0} Items</div>
					</div>

					<TooltipProvider>
						<div className="flex gap-2">
							{isModpack ? (/** 
								TODO: Impl update check
								<UpdateModpackCheck
										loader={profile.data.loader}
										game={profile.data.version}
										id={profile.data.is_modpack as string}
									/>
							*/
								<>
									<Tooltip>
										<AlertDialog>
											<AlertDialogTrigger asChild>
												<TooltipTrigger asChild>
													<Button variant="secondary" size="icon">
														<LockOpen />
													</Button>
												</TooltipTrigger>
											</AlertDialogTrigger>
											<AlertDialogContent>
												<AlertDialogHeader>
													<AlertDialogTitle>Unlock modpack</AlertDialogTitle>
													<AlertDialogDescription>Are you sure you want to unlock this pack? This can not be undone. Unlocking this pack will allow you to have full control over all content in this pack but you will no longer get update for this pack.</AlertDialogDescription>
												</AlertDialogHeader>
												<AlertDialogFooter>
													<AlertDialogCancel>Cancel</AlertDialogCancel>
													<AlertDialogAction onClick={() => unlockModpack(profile.data.id)}>Continue</AlertDialogAction>
												</AlertDialogFooter>
											</AlertDialogContent>
										</AlertDialog>
										<TooltipContent>
											<p>Unlock modpack</p>
										</TooltipContent>
									</Tooltip>
								</>
							) : null /** 
								TODO: button for updating all content of a category in a profile 
							
								<Tooltip>
									<TooltipTrigger asChild>
										<Button variant="secondary" size="icon">
											<ArrowUp01 />
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p>Update All</p>
									</TooltipContent>
								</Tooltip>
							*/}
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										variant="secondary"
										size="icon"
										onClick={() => profileImportFile(profile.data.id, selected)}
									>
										<Import />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<p>Import File</p>
								</TooltipContent>
							</Tooltip>
						</div>
					</TooltipProvider>
				</div>
				<Separator />
				<div className="pb-2 overflow-y-auto scrollbar h-full">
					<ContentTab
						isModpack={selected === "Mod" && isModpack}
						content_type={selected}
						profile={profile.data}
						content={content}
					/>
				</div>
			</Tabs>
		</div>
	);
}
