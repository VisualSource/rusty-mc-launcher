import { useQuery } from "@tanstack/react-query";
import { Anvil } from "lucide-react";
import { compare } from "semver";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { getProjectVersions, versionFromHash } from "@/lib/api/modrinth/sdk.gen";
import { Button } from "@/components/ui/button";

export const UpdateModpackCheck: React.FC<{ id: string, game: string; loader: string }> = ({ id, game, loader }) => {
    const { data } = useQuery({
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        initialData: false,
        queryKey: ["MODPACK_SHA1_HASH", id],
        queryFn: async () => {
            const { error, data } = await versionFromHash({
                path: {
                    hash: id
                },
                query: {

                    algorithm: "sha1"
                },
            });
            if (error) throw error;
            if (!data) throw new Error("Missing version from hash");

            const projects = await getProjectVersions({
                path: {
                    "id|slug": data.project_id
                },
                query: {
                    loaders: JSON.stringify([loader]),
                    game_versions: JSON.stringify([game])
                }
            });
            if (projects.error) throw projects.error;

            const project = projects.data?.at(0);


            if (!data.version_number || !project?.version_number) return false;


            const isUpdate = compare(data.version_number, project.version_number) === -1;

            return isUpdate;
        },
    })


    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="relative">
                    {data ? (<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2 animate-pulse" />) : null}
                    <Button variant="secondary" size="icon">
                        <Anvil />
                    </Button>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Update modpack</p>
            </TooltipContent>
        </Tooltip>
    );
}