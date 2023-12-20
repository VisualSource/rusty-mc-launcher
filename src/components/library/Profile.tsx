import { Link, useLoaderData } from "react-router-dom";
import { Settings, Stars } from "lucide-react";

import { TypographyH1, TypographyH4 } from "../ui/typography";
import { MinecraftProfile } from "@/lib/models/profiles";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

import useIsGameRunning from "@/lib/hooks/useIsGameRunning";
import useRunGame from "@/lib/hooks/useRunGame";
import useCategoryMutation from "@/lib/hooks/useCategoryMutation";
import { cn } from "@/lib/utils";

const Profile: React.FC = () => {
    const { state: isRunning, isLoading } = useIsGameRunning();
    const data = useLoaderData() as MinecraftProfile;
    const mutate = useCategoryMutation();
    const { run } = useRunGame();

    return (
        <ScrollArea className="text-zinc-50">
            <div className="w-full h-72 bg-blue-950 relative">
                <TypographyH1>{data.name}</TypographyH1>
                <div className="flex p-4 absolute bottom-0 w-full justify-between bg-zinc-900/60">
                    <div className="flex items-center gap-4">
                        <Button className={cn({ "bg-orange-500 hover:bg-orange-500/90 dark:bg-orange-900 dark:text-zinc-50 dark:hover:bg-orange-900/90": isRunning })} disabled={isRunning || isLoading} onClick={() => run(data)} size="lg">{isLoading ? "Loading..." : isRunning ? "Running" : "Play"}</Button>

                        <div>
                            <TypographyH4>LAST PLAYED</TypographyH4>
                            <p>{data.lastUsed?.toUTCString() ?? "NEVER"}</p>
                        </div>
                    </div>

                    <div className="flex gap-2 items-center">
                        <Button asChild size="icon">
                            <Link to={`/profile/edit/${data.id}`}>
                                <Settings />
                            </Link>
                        </Button>
                        <Button onClick={() => {
                            mutate.mutate({ type: "create", profile: data.id, group: 1 });
                        }} size="icon">
                            <Stars />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="h-96">
            </div>
        </ScrollArea>
    );
}

export default Profile;