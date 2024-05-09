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
import { Button } from "@component/ui/button";


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
    shortText: string;
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
        .then((value) => value.entries.slice(0, 10)),
  });

  if (error) throw new Error("Failed to load patch notes");

  return (
    <>
      {data.map((value) => (
        <Card className="relative w-96" key={value.id}>
          <CardHeader>
            <CardTitle> {value.title}</CardTitle>
            <CardDescription>{value.type}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Avatar className="h-56 w-full rounded-none">
              <AvatarImage
                src={`https://launchercontent.mojang.com${value.image.url}`}
                alt={value.image.title}
                className="rounded-none"
              />
              <AvatarFallback className="rounded-none">
                <GanttChartSquare />
              </AvatarFallback>
            </Avatar>
            <p className="text-wrap text-sm">{value.shortText}</p>
            <Button>View Notes</Button>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export default PatchNotes;
