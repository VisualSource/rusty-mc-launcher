import { useOutletContext } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { ContentTab } from "./ContentTab";

const ProfileContent: React.FC = () => {
	const ctx = useOutletContext() as MinecraftProfile;

	return (
		<div className="h-full space-y-4 overflow-hidden rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
			<Tabs defaultValue="logs" className="flex h-full w-full flex-col">
				<TabsList className="w-full">
					<TabsTrigger value="mods">Mods</TabsTrigger>
					<TabsTrigger value="resource">Resource Packs</TabsTrigger>
					<TabsTrigger value="shader">Shader Packs</TabsTrigger>
				</TabsList>
				<TabsContent value="mods" className="h-full flex-col pb-10">
					<ContentTab profile={ctx.id} content_type="Mod" />
				</TabsContent>
				<TabsContent value="resource" className="h-full flex-col pb-10">
					<ContentTab profile={ctx.id} content_type="Resourcepack" />
				</TabsContent>
				<TabsContent value="shader" className="h-full flex-col pb-10">
					<ContentTab profile={ctx.id} content_type="Shader" />
				</TabsContent>
			</Tabs>
		</div>
	);
};

export default ProfileContent;
