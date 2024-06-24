import { useSuspenseQuery } from "@tanstack/react-query";
import { Box, GanttChartSquare } from "lucide-react";
import { Link } from "@tanstack/react-router";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { searchProjects } from "@lib/api/modrinth/services.gen";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { Button } from "@/components/ui/button";

const ModPacks: React.FC = () => {
	const { data, error } = useSuspenseQuery({
		queryKey: ["modrinth", "modpacks", "popular"],
		queryFn: async () => {
			const response = await searchProjects({
				client: modrinthClient,
				query: {
					limit: 10,
					facets: `[["project_type:modpack"]]`,
					index: "follows",
				}
			});
			if (response.error) throw response.error;
			return response.data;
		}
	});
	if (error) throw error;
	return (
		<>
			{data.hits.map((value) => (
				<Card className="relative w-96" key={value.project_id}>
					<CardHeader className="space-y-none flex flex-row items-center space-x-1.5">
						<Avatar>
							<AvatarFallback>
								<Box />
							</AvatarFallback>
							<AvatarImage src={value.icon_url ?? undefined} />
						</Avatar>
						<div>
							<CardTitle title={value.title} className="line-clamp-1 text-wrap"> {value.title}</CardTitle>
							<CardDescription>By {value.author}</CardDescription>
						</div>
					</CardHeader>
					<CardContent className="flex flex-col gap-4">
						<Avatar className="h-56 w-full rounded-none">
							<AvatarImage
								src={value.featured_gallery ?? value.gallery?.at(0)}
								alt={value.title}
								className="rounded-none"
							/>
							<AvatarFallback className="rounded-none">
								<GanttChartSquare />
							</AvatarFallback>
						</Avatar>
						<Button asChild>
							<Link to="/workshop/project/$id" params={{ id: value.project_id }}>View Pack</Link>
						</Button>
					</CardContent>
				</Card>
			))}
		</>
	);
};

export default ModPacks;
