import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Sparkles, TriangleAlert } from "lucide-react";
import {
    WorkshopPagination,
    getPaginationItems,
    getPage,
    getOffset,
} from "@/components/workshop/WorkshopPagination";
import { searchProjects } from "@/lib/api/modrinth/sdk.gen";
import { Card, CardContent, CardHeader } from "../ui/card";
import { SearchContentCard } from "./SearchContentCard";
import { useSearch } from "@/hooks/useSearch";

import { TypographyH3 } from "../ui/typography";
import { Skeleton } from "../ui/skeleton";

const queryContent = async (params: ReturnType<typeof useSearch>) => {
    const { error, data, response } = await searchProjects({
        query: {
            query: params.query,
            facets: JSON.stringify(params.facets.toArray()),
            offset: params.offset,
            limit: params.limit,
            index: params.index,
        },
    });
    if (error) throw error;
    if (!response.ok || !data)
        throw new Error("Failed to load search results", { cause: response });

    const maxPages = getPage(
        data.total_hits,
        data.limit,
        data.total_hits - data.limit,
    );
    const currentPage = getPage(data.total_hits, data.limit, data.offset);
    const items = getPaginationItems(
        maxPages,
        data.limit,
        data.total_hits,
        currentPage,
        data.offset,
    );
    const prev = getOffset(data.offset - data.limit, data.total_hits);
    const next = getOffset(data.offset + data.limit, data.total_hits);

    return {
        prev,
        next,
        currentPage,
        maxPages,
        hits: data.hits,
        totalHits: data.total_hits,
        links: items,
    };
}

export const SearchContent: React.FC = () => {
    const search = useSearch();
    const { isPending, isError, error, data, isPlaceholderData } = useQuery({
        queryKey: [
            "MODRINTH_SERACH",
            search.query,
            search.index,
            search.limit,
            search.facets,
            search.offset,
        ],
        queryFn: () => queryContent(search),
        placeholderData: keepPreviousData,
    });

    if (isPending) return (
        <>
            {Array.from({ length: search.limit }).map((_, i) => (
                <Card key={`skeletion_${i + 1}`}>
                    <CardHeader className="flex-row gap-4 space-y-0 pb-2">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div>
                            <Skeleton className="h-5 w-32 mt-1 mb-2" />
                            <span className="text-sm text-muted-foreground">
                                <Skeleton className="h-4 w-24" />
                            </span>
                        </div>
                    </CardHeader>
                    <CardContent className="flex grow flex-col">
                        <div className="col-span-3 flex flex-col gap-2 justify-between h-full">
                            <Skeleton className="w-full h-16" />
                            <div className="space-y-1">
                                <div className="flex flex-wrap gap-1">
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                    <Skeleton className="h-5 w-10" />
                                </div>
                                <div className="flex items-center gap-2 flex-wrap" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </>
    );

    if (isError) return (
        <div className="col-span-full row-span-full flex flex-col items-center justify-center">
            <TriangleAlert className="h-20 w-20" />
            <TypographyH3>Failed to load search results!</TypographyH3>
            <pre className="text-sm">
                <code>{error?.message}</code>
            </pre>
        </div>
    );

    if (!data?.hits.length) return (
        <div className="col-span-full row-span-full flex flex-col items-center justify-center">
            <Sparkles className="h-20 w-20" />
            <TypographyH3>No results found!</TypographyH3>
        </div>
    );

    return (
        <div className="w-full h-full overflow-y-scroll flex flex-col scrollbar relative">
            <WorkshopPagination
                isPlaceHolder={isPlaceholderData}
                offsetNext={data?.next ?? 0}
                offsetPrev={data?.prev ?? 0}
                isLoading={isPending}
                isError={isError}
                totalHits={data?.totalHits ?? 0}
                currentPage={data?.currentPage ?? 0}
                maxPages={data?.maxPages ?? 0}
                items={data?.links ?? []}
            />
            <div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-3 xl:grid-cols-3 grow">
                {data.hits.map(e => (
                    <SearchContentCard key={e.project_id} project={e} />
                ))}
            </div>
            <WorkshopPagination
                isPlaceHolder={isPlaceholderData}
                offsetNext={data?.next ?? 0}
                offsetPrev={data?.prev ?? 0}
                isLoading={isPending}
                isError={isError}
                totalHits={data?.totalHits ?? 0}
                currentPage={data?.currentPage ?? 0}
                maxPages={data?.maxPages ?? 0}
                items={data?.links ?? []}
            />
        </div>
    );
}