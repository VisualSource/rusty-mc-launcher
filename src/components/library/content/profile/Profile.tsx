import { Link, useLoaderData } from "react-router-dom";
import { formatRelative } from "date-fns/formatRelative";
import { Settings, Stars } from "lucide-react";

import { TypographyH1, TypographyH4 } from "@component/ui/typography";
import useCategoryMutation from "@hook/useCategoryMutation";
import { MinecraftProfile } from "@lib/models/profiles";
import { ScrollArea } from "@component/ui/scroll-area";
import PlayButton from "@/components/ui/play";
import { Button } from "@component/ui/button";

const Profile: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile;
  const mutate = useCategoryMutation();

  return (
    <ScrollArea className="text-zinc-50">
      <div className="w-full h-72 bg-blue-950 relative">
        <TypographyH1 className="p-2 line-clamp-1">{data.name}</TypographyH1>
        <div className="flex p-4 absolute bottom-0 w-full justify-between bg-zinc-900/60">
          <div className="flex items-center gap-4">
            <PlayButton size="lg" profile={data} />
            <div>
              <TypographyH4>LAST PLAYED</TypographyH4>
              <p>
                {data.lastUsed
                  ? formatRelative(data.lastUsed, new Date())
                  : "NEVER"}
              </p>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <Button asChild size="icon">
              <Link to={`/profile/edit/${data.id}`}>
                <Settings />
              </Link>
            </Button>
            <Button
              onClick={() => {
                mutate.mutate({ type: "create", profile: data.id, group: 1 });
              }}
              size="icon"
            >
              <Stars />
            </Button>
          </div>
        </div>
      </div>

      <div className="h-96"></div>
    </ScrollArea>
  );
};

export default Profile;
