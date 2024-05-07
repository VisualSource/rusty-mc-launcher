import { Component, LibraryBig, Settings } from "lucide-react";
import { Link, useLoaderData } from "react-router-dom";
import { formatRelative } from "date-fns/formatRelative";
import { Suspense } from "react";

import {
  TypographyH1,
  TypographyH4,
  TypographyMuted,
} from "@component/ui/typography";
import { MinecraftProfile } from "@lib/models/profiles";
import { ScrollArea } from "@component/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ProfileCategories from "./ProfileCategories";
import useDownload from "@hook/useDownload";
import PlayButton from "@/components/ui/play";
import { Button } from "@component/ui/button";
import AddToCategory from "./AddToCategory";

const Profile: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile;
  const { validateMods } = useDownload();

  return (
    <ScrollArea className="text-zinc-50">
      <div className="flex h-72 flex-col justify-between bg-blue-950">
        <div className="flex max-w-3xl flex-col p-2 xl:max-w-7xl">
          <TypographyH1 className="line-clamp-1">{data.name}</TypographyH1>
          <ProfileCategories id={data.id} />
        </div>
        <div className="relative flex">
          <div className="absolute bottom-0 flex w-full justify-between bg-zinc-900/60 p-4">
            <div className="shrink-1 flex items-center gap-4">
              <PlayButton size="lg" profile={data} />
              <div className="flex flex-col">
                <TypographyH4>LAST PLAYED</TypographyH4>
                <p>
                  {data.lastUsed
                    ? formatRelative(data.lastUsed, new Date(), {})
                    : "NEVER"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button title="Settings" asChild size="icon">
                <Link to={`/profile/edit/${data.id}`}>
                  <Settings />
                </Link>
              </Button>
              <Suspense
                fallback={
                  <Button disabled size="icon">
                    <LibraryBig />
                  </Button>
                }
              >
                <AddToCategory id={data.id} />
              </Suspense>
              {data.loader !== "vanilla" ? (
                <Button
                  onClick={() => validateMods(data.id)}
                  size="icon"
                  title="Validate Files"
                >
                  <Component />
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
      <div className="h-96">
        <section className="container py-4">
          <TypographyH4>Profile Info</TypographyH4>
          <Separator />
          <div>
            Game Version:{" "}
            <TypographyMuted asChild>
              <span>{data.lastVersionId}</span>
            </TypographyMuted>
          </div>
        </section>

        {data.loader !== "vanilla" ||
          data.lastVersionId.includes("fabric") ||
          data.lastVersionId.includes("forge") ? (
          <section className="container py-4">
            <TypographyH4>Mods</TypographyH4>
            <Separator />
            <ul className="space-y-1">
              {data.mods?.map((value) => (
                <li key={value.id} className="p-2">
                  <h6 className="text-sm">{value.name}</h6>
                  <TypographyMuted>Version: {value.version}</TypographyMuted>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </ScrollArea>
  );
};

export default Profile;
