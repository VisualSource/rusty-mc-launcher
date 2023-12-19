import { Link, useLoaderData } from "react-router-dom";
import { Settings, Star } from "lucide-react";

import { TypographyH1, TypographyH4 } from "../ui/typography";
import { MinecraftProfile } from "@/lib/models/profiles";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

import useIsGameRunning from "@/lib/hooks/useIsGameRunning";
import useRunGame from "@/lib/hooks/useRunGame";

const Profile: React.FC = () => {
    const { state: isRunning, isLoading } = useIsGameRunning();
    const data = useLoaderData() as MinecraftProfile;
    const { run } = useRunGame();

    return (
        <ScrollArea className="text-zinc-50">
            <div className="w-full h-72 bg-blue-950 relative">
                <TypographyH1>{data.name}</TypographyH1>
                <div className="flex p-4 absolute bottom-0 w-full justify-between bg-zinc-900/60">
                    <div className="flex items-center gap-4">
                        <Button disabled={isRunning || isLoading} onClick={() => run(data)} size="lg">Play</Button>

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
                        <Button size="icon">
                            <Star />
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