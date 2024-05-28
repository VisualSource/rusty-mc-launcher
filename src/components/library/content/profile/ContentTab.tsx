import { AlertTriangle, Box, LoaderCircle, Trash2 } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TypographyH3, TypographyMuted } from "@/components/ui/typography";
import { ProjectsService, VersionFilesService } from "@/lib/api/modrinth";
import { type ContentType, workshop_content } from "@/lib/models/content";

import { Button } from "@/components/ui/button";
import { db, uninstallItem } from "@/lib/system/commands";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "react-toastify";
import { queryClient } from "@/lib/config/queryClient";

import logger from "@system/logger";

async function uninstall(filename: string, type: string, profile: string) {
    try {
        if (!filename) throw new Error("Missing file name");
        await uninstallItem(type, filename, profile);

        await db.execute({
            query: "DELETE FROM profile_content WHERE profile = ? AND file_name = ? AND type = ?",
            args: [profile, filename, type]
        });

        await queryClient.invalidateQueries({ queryKey: ["WORKSHOP_CONTENT", type, profile] });
    } catch (error) {
        console.error(error);
        logger.error((error as Error).message);
        toast.error("Failed to uninstall content", { data: { error: (error as Error).message } });
    }
}

export const ContentTab: React.FC<{ profile: string, content_type: ContentType }> = ({ profile, content_type, }) => {
    const container = useRef<HTMLDivElement>(null);
    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["WORKSHOP_CONTENT", content_type, profile],
        queryFn: async () => {
            const data = await db.select({ query: "SELECT * FROM profile_content WHERE profile = ? AND type = ?; ", args: [profile, content_type], schema: workshop_content.schema })

            const result = await Promise.allSettled(data.map(async (item) => {
                try {
                    if (item.id.length) {
                        const project = await ProjectsService.getProject({ idSlug: item.id });
                        return { record: item, project };
                    } else if (item.sha1) {
                        const version = await VersionFilesService.versionFromHash({ hash: item.sha1, algorithm: "sha1" });
                        const project = await ProjectsService.getProject({ idSlug: version.project_id });

                        return { record: item, project }
                    }

                    return { record: item, project: null }
                } catch (error) {
                    return { record: item, project: null }
                }
            }));

            return result.map(e => e.status === "fulfilled" ? e.value : null).filter(Boolean)
        }
    });

    const rowVirtualizer = useVirtualizer({
        count: data?.length ?? 0,
        getScrollElement: () => container.current,
        estimateSize: () => 50
    })

    return (
        <div ref={container} className="overflow-y-scroll h-full">
            {isLoading ? (
                <div className="w-full h-full flex flex-col items-center justify-center">
                    <div className="flex gap-2">
                        <LoaderCircle className="animate-spin" />
                        <pre>Loading Content</pre>
                    </div>
                </div>
            ) : isError ? (
                <div className="flex h-full flex-col items-center justify-center text-zinc-50">
                    <AlertTriangle />
                    <TypographyH3>Something went wrong:</TypographyH3>
                    <pre className="text-red-300">{error.message}</pre>
                </div>
            ) : (
                <div className="w-full relative" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    {rowVirtualizer.getVirtualItems().map((virtualItem) => (
                        <div key={virtualItem.key} className="absolute top-0 left-0 w-full inline-flex items-center gap-2" style={{ height: `${virtualItem.size}px`, transform: `translateY(${virtualItem.start}px)` }}>
                            <Avatar className="rounded-md">
                                <AvatarFallback className="rounded-md">
                                    <Box />
                                </AvatarFallback>
                                <AvatarImage src={data?.[virtualItem.index].project?.icon_url ?? undefined} />
                            </Avatar>
                            <div>
                                {data?.[virtualItem.index].project ? (
                                    <Link className="-mb-1 line-clamp-1 underline" to={`/workshop/project/${data?.[virtualItem.index].project?.id ?? ""}`}>{data?.[virtualItem.index].project?.title}</Link>
                                ) : (
                                    <h1 className="-mb-1 line-clamp-1">{data?.[virtualItem.index].project?.title ?? data?.[virtualItem.index].record.file_name}</h1>
                                )}
                                <TypographyMuted>{data?.[virtualItem.index].record.version ?? data?.[virtualItem.index].record.file_name}</TypographyMuted>
                            </div>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" className="ml-auto" size="icon">
                                        <Trash2 className="h-5 w-5" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="text-white">
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This action will delete this content, and can not be undone.
                                            Deleting this may also break this install if this content is a dependency of other content that is installed.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => uninstall(data?.[virtualItem.index].record.file_name!, content_type, profile)}>Ok</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}