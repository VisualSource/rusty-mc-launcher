import { createLazyFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import PatchNotes, { PatchNotesSkeletons } from "@/components/library/content/PatchNotes";
import Favorites, { FavoritesLoading } from "@/components/library/content/Favorites";
import ModPacks, { ModPacksSkeleton } from "@/components/library/content/ModPacks";
import { ErrorFallback } from "@/components/library/content/ErrorFallback";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/Loading";

export const Route = createLazyFileRoute("/_authenticated/_layout/")({
	component: Index,
	pendingComponent: Loading
});

function Index() {
	return (
		<div className="ml-4 overflow-y-scroll overflow-x-hidden scrollbar pr-2">
			<section className="mt-6 space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight">
					Favorites
				</h2>
				<Separator className="my-4" />
				<div className="relative">
					<ScrollArea>
						<div className="flex space-x-4 pb-4">
							<ErrorBoundary fallbackRender={ErrorFallback}>
								<Suspense fallback={<FavoritesLoading />}>
									<Favorites />
								</Suspense>
							</ErrorBoundary>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</section>

			<section className="mt-6 space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight">
					Patch Notes
				</h2>
				<Separator className="my-4" />
				<div className="relative">
					<ScrollArea>
						<div className="flex space-x-4 pb-4">
							<ErrorBoundary fallbackRender={ErrorFallback}>
								<Suspense fallback={<PatchNotesSkeletons />}>
									<PatchNotes />
								</Suspense>
							</ErrorBoundary>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</section>

			<section className="mt-6 space-y-4">
				<h2 className="text-2xl font-semibold tracking-tight">
					Popular Modpacks
				</h2>
				<Separator className="my-4" />
				<div className="relative">
					<ScrollArea>
						<div className="flex space-x-4 pb-4">
							<ErrorBoundary fallbackRender={ErrorFallback}>
								<Suspense fallback={<ModPacksSkeleton />}>
									<ModPacks />
								</Suspense>
							</ErrorBoundary>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</div>
			</section>
		</div>
	);
}
