import { useSuspenseQuery } from "@tanstack/react-query";
import { GanttChartSquare } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@component/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import { Button } from "@component/ui/button";
import PatchNotesRoot from "./PatchNotesRoot";
import { wait } from "@/utils/timer";

type PatchNodes = {
  version: number;
  entries: {
    title: string;
    version: string;
    type: "snapshot" | "release";
    image: {
      url: string;
      title: string;
    };
    contentPath: string;
    id: string;
  }[];
};

const PatchNotes: React.FC = () => {
  const { data, error } = useSuspenseQuery({
    queryKey: ["PATCH_NOTES"],
    queryFn: () =>
      fetch("https://launchercontent.mojang.com/v2/javaPatchNotes.json")
        .then((value) => value.json() as Promise<PatchNodes>)
        .then((value) => value.entries),
  });

  if (error) throw new Error("Failed to load patch notes");

  return (
    <PatchNotesRoot>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex w-max space-x-4 p-4 flex-nowrap">
          {data.slice(0, 8).map((value) => (
            <Card className="relative w-80" key={value.id}>
              <CardHeader>
                <CardTitle> {value.title}</CardTitle>
                <CardDescription>{value.type}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <Avatar className="rounded-none w-full h-56">
                  <AvatarImage
                    src={`https://launchercontent.mojang.com${value.image.url}`}
                    alt={value.image.title}
                    className="rounded-none"
                  />
                  <AvatarFallback className="rounded-none">
                    <GanttChartSquare />
                  </AvatarFallback>
                </Avatar>
                <Button>View Notes</Button>
              </CardContent>
            </Card>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </PatchNotesRoot>
  );
};

export default PatchNotes;
