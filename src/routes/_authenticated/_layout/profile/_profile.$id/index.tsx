import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { open } from "@tauri-apps/api/dialog";
import { toast } from "react-toastify";
import { Import } from "lucide-react";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentTab } from "@/components/library/content/profile/ContentTab";
import { importContentExternal } from "@/lib/system/commands";
import { profileQueryOptions } from "../_profile.$id";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import logger from "@system/logger";

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/",
)({
	component: ProfileContent,
	pendingComponent: Loading,
});

function ProfileContent() {
	const [selected, setSelected] = useState<"Mod" | "Resourcepack" | "Shader">("Mod");
	const params = Route.useParams();
	const profile = useSuspenseQuery(profileQueryOptions(params.id));

	return (
		<div className="h-full space-y-4 overflow-hidden rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
			<Tabs value={selected} onValueChange={(e) => setSelected(e as "Mod" | "Resourcepack" | "Shader")} className="flex h-full w-full flex-col">
				<TabsList className="w-full">
					<TabsTrigger value="mod">Mods</TabsTrigger>
					<TabsTrigger value="resourcepack">Resource Packs</TabsTrigger>
					<TabsTrigger value="shader">Shader Packs</TabsTrigger>
				</TabsList>
				<div className="mt-4 flex justify-end">
					<Button variant="secondary" size="sm" onClick={async () => {
						const file = await open({
							title: "Import Content",
							filters: [
								{
									name: "Mod",
									extensions: ["jar"]
								},
								{
									name: "Resource Pack | Shader Pack",
									extensions: ["zip"]
								}
							]
						})
						if (!file || Array.isArray(file)) return;

						const id = toast.loading("Importing Content");
						try {
							await importContentExternal(file, profile.data.id, selected);
							await queryClient.invalidateQueries({ queryKey: ["WORKSHOP_CONTENT", selected, profile.data.id] });
							toast.update(id, { render: "Imported Content", type: "success", isLoading: false, autoClose: 5000 });
						} catch (error) {
							console.error(error);
							logger.error((error as Error).message);
							toast.update(id, { render: "Failed to import content", type: "error", isLoading: false, autoClose: 5000 });
						}
					}}>
						<Import className="h-4 w-4 mr-2" />
						Import External</Button>
				</div>
				<TabsContent value="Mod" className="pb-2 overflow-y-auto scrollbar">
					<ContentTab profile={profile.data} content_type="Mod" />
				</TabsContent>
				<TabsContent value="Resourcepack" className="pb-2 overflow-y-auto scrollbar">
					<ContentTab profile={profile.data} content_type="Resourcepack" />
				</TabsContent>
				<TabsContent value="Shader" className="pb-2 overflow-y-auto scrollbar">
					<ContentTab profile={profile.data} content_type="Shader" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
