import { useLoaderData } from "react-router-dom";
import { Separator } from "../ui/separator";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { TypographyH3 } from "../ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Book } from "lucide-react";
import useIsGameRunning from "@/lib/hooks/useIsGameRunning";
import useRunGame from "@/lib/hooks/useRunGame";
import { MinecraftProfile } from "@/lib/models/profiles";
import { cn } from "@/lib/utils";

const LibraryRoot: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile[];
  const { isLoading, state: isRunning } = useIsGameRunning();
  const { run } = useRunGame();

  return (
    <div className="container text-zinc-50">
      <ScrollArea>
        <section>
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
                    <Button
                      className={cn({
                        "bg-orange-500 hover:bg-orange-500/90 dark:bg-orange-900 dark:text-zinc-50 dark:hover:bg-orange-900/90":
                          isRunning,
                      })}
                      disabled={isLoading || isRunning}
                      onClick={() => run(value)}
                    >
                      Play
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </section>
      </ScrollArea>
    </div>
  );
};

export default LibraryRoot;
