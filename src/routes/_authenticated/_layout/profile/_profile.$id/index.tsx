import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ContentTab } from "@/components/library/content/profile/ContentTab";
import { profileQueryOptions } from "../_profile.$id";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/",
)({
	component: ProfileContent,
	pendingComponent: Loading,
});

function ProfileContent() {
	const params = Route.useParams();
	const profile = useSuspenseQuery(profileQueryOptions(params.id));

	return (
		<div className="h-full space-y-4 overflow-hidden rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
			<Tabs defaultValue="mods" className="flex h-full w-full flex-col">
				<TabsList className="w-full">
					<TabsTrigger value="mods">Mods</TabsTrigger>
					<TabsTrigger value="resource">Resource Packs</TabsTrigger>
					<TabsTrigger value="shader">Shader Packs</TabsTrigger>
				</TabsList>
				<TabsContent value="mods" className="h-full flex-col pb-10">
					<ContentTab profile={profile.data} content_type="Mod" />
				</TabsContent>
				<TabsContent value="resource" className="h-full flex-col pb-10">
					<ContentTab profile={profile.data} content_type="Resourcepack" />
				</TabsContent>
				<TabsContent value="shader" className="h-full flex-col pb-10">
					<ContentTab profile={profile.data} content_type="Shader" />
				</TabsContent>
			</Tabs>
		</div>
	);
}
