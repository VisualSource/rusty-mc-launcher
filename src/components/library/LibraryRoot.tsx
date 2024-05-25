import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import { PatchNotesLoading } from "./content/patchnotes/patchNotesFallback";
import Favorites, { FavoritesLoading } from "./content/Favorites";
import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import PatchNotes from "./content/patchnotes/PatchNotes";
import { ErrorFallback } from "./content/ErrorFallback";
import { TypographyH3 } from "@component/ui/typography";
import { Separator } from "@component/ui/separator";
import ModPacks from "./content/ModPacks";

const LibraryRoot: React.FC = () => {
  return (
    <div className="scrollbar container w-full overflow-x-hidden overflow-y-scroll py-4 text-zinc-50">
      <section className="flex flex-col">
        <div className="flex items-center gap-4 pb-2 pt-4">
          <TypographyH3>Favorites</TypographyH3>
          <Separator className="dark:bg-zinc-50" />
        </div>
        <ErrorBoundary fallbackRender={ErrorFallback}>
          <ScrollArea className="h-80 w-full whitespace-nowrap">
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
};

export default LibraryRoot;
