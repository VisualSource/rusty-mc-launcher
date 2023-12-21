import { ErrorBoundary } from "react-error-boundary";
import { useLoaderData } from "react-router-dom";
import { Book } from "lucide-react";
import { Suspense } from "react";

import {
  PatchNotesError,
  PatchNotesLoading,
} from "./content/patchnotes/patchNotesFallback";
import { Card, CardContent, CardHeader, CardTitle } from "@component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import type { MinecraftProfile } from "@lib/models/profiles";
import PatchNotes from "./content/patchnotes/PatchNotes";
import { TypographyH3 } from "@component/ui/typography";
import { Separator } from "@component/ui/separator";
import PlayButton from "../ui/play";

const LibraryRoot: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile[];

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
              {data.map((value) => (
                <Card className="relative w-80" key={value.id}>
                  <CardHeader>
                    <CardTitle>{value.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Avatar className="rounded-none w-full aspect-square h-36">
                      <AvatarImage
                        src={value.icon ?? undefined}
                        className="rounded-none"
                      />
                      <AvatarFallback className="rounded-none">
                        <Book />
                      </AvatarFallback>
                    </Avatar>
                    <PlayButton profile={value} />
                  </CardContent>
                </Card>
              ))}
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
