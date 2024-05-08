
import { useQuery } from '@tanstack/react-query';

import { TypographyH2, TypographyH3, TypographyInlineCode } from "../ui/typography";
import { WorkshopCard, WorkshopCardSkeleton } from "./WorkshopCard";
import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import { ProjectsService } from "@lib/api/modrinth/services.gen";
import { Separator } from '../ui/separator';
import SearchBar from './SearchBar';

const Workshop = () => {
    const newReleases = useQuery({
        queryKey: ["modrinth", "new_releases"],
        queryFn: () => ProjectsService.searchProjects({
            limit: 10,
            index: "newest",
        })
    })
    const popular = useQuery({
        queryKey: ["modrinth", "relevance"],
        queryFn: () => ProjectsService.searchProjects({
            limit: 10,
            index: "relevance",
        })
    });

    return (
        <div className="flex flex-col overflow-hidden w-full">
            <SearchBar />
            <div className="pl-6 overflow-y-scroll scrollbar bg-zinc-900">
                <section className="h-64 flex flex-col">
                    <TypographyH3 className="mb-2">Popular</TypographyH3>
                    <Separator className="dark:bg-white" />
                    <ScrollArea className="whitespace-nowrap">
                        {popular.isLoading ? (
                            <div className="flex w-max space-x-6 p-4">
                                {Array(10).fill(0).map((_, i) => (
                                    <WorkshopCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : popular.isError ? (
                            <div className='flex flex-col justify-center items-center h-40'>
                                <TypographyH2>Failed to load</TypographyH2>
                                <TypographyInlineCode className="text-red-500">{popular?.error.message}</TypographyInlineCode>
                            </div>
                        ) : (
                            <div className="flex w-max space-x-6 p-4">
                                {popular.data?.hits.map((item) => (
                                    <WorkshopCard project={item} key={item.project_id} />
                                ))}
                            </div>
                        )}
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>

                <section className="h-64 flex flex-col">
                    <TypographyH3 className="mb-2">Newest</TypographyH3>
                    <Separator className="dark:bg-white" />
                    <ScrollArea className="whitespace-nowrap">
                        {newReleases.isLoading ? (
                            <div className="flex w-max space-x-6 p-4">
                                {Array(10).fill(0).map((_, i) => (
                                    <WorkshopCardSkeleton key={i} />
                                ))}
                            </div>
                        ) : newReleases.isError ? (
                            <div className='flex flex-col justify-center items-center h-40'>
                                <TypographyH2>Failed to load</TypographyH2>
                                <TypographyInlineCode className="text-red-500">{newReleases?.error.message}</TypographyInlineCode>
                            </div>
                        ) : (
                            <div className="flex w-max space-x-6 p-4">
                                {newReleases.data?.hits.map((item) => (
                                    <WorkshopCard project={item} key={item.project_id} />
                                ))}
                            </div>
                        )}
                        <ScrollBar orientation="horizontal" />
                    </ScrollArea>
                </section>
            </div>
        </div>
    );
}

export default Workshop;
