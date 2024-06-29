import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileImage } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { searchProjects } from "@lib/api/modrinth/services.gen";

export const ModPacksSkeleton: React.FC = () => {
	return (
		<>
			{Array.from({ length: 8 }).map((_, i) => (
				<div className="space-y-3 w-[200px]" key={`fav_profile_skel_${i + 1}`}>
					<div className="space-y-1 text-sm">
						<Skeleton className="h-[200px] w-[200px]" />
					</div>
					<div className="space-y-1 text-sm flex items-center gap-2 px-2">
						<Skeleton className="rounded-full h-10 w-10" />
						<Skeleton className="h-10 w-20" />
					</div>
					<div className="space-y-1">
						<Skeleton className="w-full h-3" />
					</div>
				</div>
			))}
		</>
	);
};

const ModPacks: React.FC = () => {
	const { data, error } = useSuspenseQuery({
		queryKey: ["MODRINTH", "MODPACKS", "POPULAR"],
		queryFn: async () => {
			const response = await searchProjects({
				client: modrinthClient,
				query: {
					limit: 10,
					facets: '[["project_type:modpack"]]',
					index: "follows",
				},
			});
			if (response.error) throw response.error;
			return response.data;
		},
	});
	if (error) throw error;
	return (
		<>
			{data.hits.map((value) => (
				<div className="space-y-3 w-[200px]" key={value.project_id}>
					<div className="overflow-hidden rounded-md">
						<img
							height={200}
							width={200}
							className="h-auto w-auto object-cover transition-all hover:scale-105 aspect-square"
							src={
								value.featured_gallery ??
								value.gallery?.at(0) ??
								value.icon_url ??
								""
							}
							alt={value.title ?? "Unnamed project"}
						/>
					</div>
					<div className="space-y-1 text-sm flex items-center gap-2 px-2">
						<Avatar>
							<AvatarImage src={value.icon_url ?? undefined} />
							<AvatarFallback>
								<FileImage />
							</AvatarFallback>
						</Avatar>
						<h3 className="font-medium leading-none">{value.title}</h3>
					</div>

					<Button asChild className="w-full">
						<Link to="/workshop/project/$id" params={{ id: value.project_id }}>
							View
						</Link>
					</Button>
				</div>
			))}
		</>
	);
};

export default ModPacks;
