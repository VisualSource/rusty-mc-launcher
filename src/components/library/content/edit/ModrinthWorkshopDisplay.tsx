import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ModPacks, { ModPacksSkeleton } from "../ModPacks";
import { Separator } from "@/components/ui/separator";
import { ErrorFallback } from "../ErrorFallback";

function ModrinthWorkshopDisplay({ params }: { params: Record<string, string> }) {
    return (
        <section className="mt-6 space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">
                {params.id === "updated" ? "Updated" : "Popular"} {params.content}s
            </h2>
            <Separator className="my-4" />
            <div className="relative">
                <ScrollArea>
                    <div className="flex space-x-4 pb-4">
                        <ErrorBoundary fallbackRender={ErrorFallback}>
                            <Suspense fallback={<ModPacksSkeleton />}>
                                <ModPacks content={params.content} sort={params.sort} />
                            </Suspense>
                        </ErrorBoundary>
                    </div>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
        </section>
    );
}

export default ModrinthWorkshopDisplay;