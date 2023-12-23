import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";

import {
  PatchNotesError,
  PatchNotesLoading,
} from "./content/patchnotes/patchNotesFallback";
import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import PatchNotes from "./content/patchnotes/PatchNotes";
import { TypographyH3 } from "@component/ui/typography";
import { Separator } from "@component/ui/separator";
import Favorites, {
  FavoritesErrored,
  FavoritesLoading,
} from "./content/Favorites";

const LibraryRoot: React.FC = () => {
  return (
    <ScrollArea>
      <div className="container text-zinc-50 py-4">
        <section className="flex flex-col">
          <div className="pt-4 flex items-center gap-4 pb-2">
            <TypographyH3>Favorites</TypographyH3>
            <Separator className="dark:bg-zinc-50" />
          </div>
          <ScrollArea className="w-full h-80 whitespace-nowrap">
            <div className="flex w-max space-x-4 p-4">
              <ErrorBoundary fallback={<FavoritesErrored />}>
                <Suspense fallback={<FavoritesLoading />}>
                  <Favorites />
                </Suspense>
              </ErrorBoundary>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
        <ErrorBoundary fallback={<PatchNotesError />}>
          <Suspense fallback={<PatchNotesLoading />}>
            <PatchNotes />
          </Suspense>
        </ErrorBoundary>
      </div>
    </ScrollArea>
  );
};

export default LibraryRoot;
