import { createLazyFileRoute } from "@tanstack/react-router";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import { PatchNotesLoading } from "@/components/library/content/patchnotes/patchNotesFallback";
import Favorites, { FavoritesLoading } from "@/components/library/content/Favorites";
import PatchNotes from "@/components/library/content/patchnotes/PatchNotes";
import { ErrorFallback } from "@/components/library/content/ErrorFallback";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ModPacks from "@/components/library/content/ModPacks";
import { TypographyH3 } from "@/components/ui/typography";
import { Separator } from "@/components/ui/separator";

export const Route = createLazyFileRoute("/_authenticated/_layout/")({
	component: Index,
});

function Index() {
	return (
		<div className="ml-4 overflow-y-scroll overflow-x-hidden scrollbar">
			<section className="flex flex-col">
				<div className="flex items-center gap-4 whitespace-nowrap pb-2 pt-4">
					<TypographyH3>Favorites</TypographyH3>
					<Separator className="dark:bg-zinc-50" />
				</div>
				<ErrorBoundary fallbackRender={ErrorFallback}>
					<ScrollArea className="w-full whitespace-nowrap">
						<div className="flex w-max space-x-4 p-4">
							<Suspense fallback={<FavoritesLoading />}>
								<Favorites />
							</Suspense>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</ErrorBoundary>
			</section>
			<section className="flex w-full flex-col">
				<div className="flex items-center gap-4 whitespace-nowrap pb-2 pt-4">
					<TypographyH3>Patch Notes</TypographyH3>
					<Separator className="dark:bg-zinc-50" />
				</div>
				<ErrorBoundary fallbackRender={ErrorFallback}>
					<ScrollArea className="w-full whitespace-nowrap">
						<div className="flex w-max flex-nowrap space-x-4 p-4">
							<Suspense fallback={<PatchNotesLoading />}>
								<PatchNotes />
							</Suspense>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</ErrorBoundary>
			</section>

			<section className="flex w-full flex-col">
				<div className="flex items-center gap-4 whitespace-nowrap pb-2 pt-4">
					<TypographyH3>Popular modpacks</TypographyH3>
					<Separator className="dark:bg-zinc-50" />
				</div>
				<ErrorBoundary fallbackRender={ErrorFallback}>
					<ScrollArea className="w-full whitespace-nowrap">
						<div className="flex w-max flex-nowrap space-x-4 p-4">
							<Suspense fallback={<PatchNotesLoading />}>
								<ModPacks />
							</Suspense>
						</div>
						<ScrollBar orientation="horizontal" />
					</ScrollArea>
				</ErrorBoundary>
			</section>
		</div>
	);
}