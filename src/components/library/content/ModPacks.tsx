import { useSuspenseQuery } from "@tanstack/react-query";
import { ProjectsService } from "@lib/api/modrinth/services.gen";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { Box, GanttChartSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
const ModPacks: React.FC = () => {
    const { data, error } = useSuspenseQuery({
        queryKey: ["modrinth", "modpacks", "popular"],
        queryFn: () => ProjectsService.searchProjects({
            limit: 10,
            facets: `[["project_type:modpack"]]`,
            index: "follows"
        })
    });
    if (error) throw error;
    return (
        <>
            {data.hits.map((value) => (
                <Card className="relative w-96" key={value.project_id}>
                    <CardHeader className="flex flex-row items-center space-y-none space-x-1.5">
                        <Avatar>
                            <AvatarFallback>
                                <Box />
                            </AvatarFallback>
                            <AvatarImage src={value.icon_url ?? undefined} />
                        </Avatar>
                        <div>
                            <CardTitle> {value.title}</CardTitle>
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
                            <Link to={`/workshop/${value.project_id}`}>View Pack</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </>
    );
}

export default ModPacks