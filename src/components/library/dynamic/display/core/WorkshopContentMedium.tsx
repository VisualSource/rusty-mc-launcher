import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { FileImage } from "lucide-react";
import { memo } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { searchProjects } from "@lib/api/modrinth/services.gen";

export const WorkshopContentMediumSkeleton: React.FC = memo(() => {
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
});

const WorkshopContentMedium: React.FC<{ content: string; sort: string }> = ({
	content,
	sort,
}) => {
	const { data, error } = useSuspenseQuery({
		queryKey: ["MODRINTH", content, sort],
		queryFn: async () => {
			const { error, data } = await searchProjects({
				client: modrinthClient,
				query: {
					limit: 10,
					facets: `[["project_type:${content}"]]`,
					index: sort as
						| "relevance"
						| "downloads"
						| "follows"
						| "newest"
						| "updated",
				},
			});
			if (error) throw error;
			return data;
		},
	});
	if (error) throw error;
	return (
		<>
			{data.hits.map((value) => (
				<div
					className="space-y-3 w-[200px] flex flex-col"
					key={value.project_id}
				>
					<div className="overflow-hidden rounded-md h-[200px]">
						<img
							className="object-cover transition-all hover:scale-105 aspect-square h-full w-full"
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
						<h3 title={value.title} className="font-medium leading-none line-clamp-2">{value.title}</h3>
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

export default WorkshopContentMedium;
