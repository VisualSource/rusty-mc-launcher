import { useLoaderData } from "react-router-dom";
import { Separator } from "../ui/separator";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";
import { TypographyH3 } from "../ui/typography";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Book } from "lucide-react";

const LibraryRoot: React.FC = () => {
    const data = useLoaderData() as { id: string; name: string; icon: string | null }[];

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
                            {data.map(value => (
                                <Card className="relative w-80" key={value.id}>
                                    <CardHeader>
                                        <CardTitle>{value.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex flex-col gap-4">
                                        <Avatar className="rounded-none w-full aspect-square h-36">
                                            <AvatarImage src={value.icon ?? undefined} className="rounded-none" />
                                            <AvatarFallback className="rounded-none">
                                                <Book />
                                            </AvatarFallback>
                                        </Avatar>
                                        <Button>Play</Button>
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
}

export default LibraryRoot;