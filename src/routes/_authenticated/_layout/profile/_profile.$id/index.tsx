import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Import } from "lucide-react";
import { useState } from "react";

import { ContentTab } from "@/components/library/content/profile/ContentTab";
import { fetchProfileContent } from "@/lib/profile/fetchProfileContent";
import { profileImportFile } from "@/lib/profile/profileImportFile";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { profileQueryOptions } from "../_profile.$id";
import { Button } from "@/components/ui/button";
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
					<Button
						variant="secondary"
						size="icon"
						title="Import File"
						onClick={() => profileImportFile(profile.data.id, selected)}
					>
						<Import />
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
