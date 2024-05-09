import { BookCopy, Box, Component, Folder, LibraryBig, Package, Play, Settings, Star } from "lucide-react";
import { Link, Outlet, useLoaderData, useParams } from "react-router-dom";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { parseLastVersionId } from "@/lib/parseLastVersionId";

const Profile: React.FC = () => {
  const data = useLoaderData() as MinecraftProfile;
  const { id } = useParams()

  const version = parseLastVersionId(data.lastVersionId);

  return (
    <div className="grid grid-cols-12 h-full p-2">

      <div className="col-span-3 p-2 space-y-4 bg-zinc-900 h-full rounded-xl shadow-md">
        <div className="flex gap-2 justify-between">
          <Avatar className="h-28 w-28 bg-zinc-600 rounded-3xl shadow-xl">
            <AvatarFallback className="bg-transparent rounded-none">
              <Box className="h-14 w-14" />
            </AvatarFallback>
            <AvatarImage src={data?.icon ?? undefined} />
          </Avatar>
          <div>

          </div>
        </div>
        <div>
          <h1 className="font-bold text-wrap text-lg line-clamp-2">{data.name}</h1>
          <p className="text-sm flex">
            {version.loader.replace(/^./, version.loader[0].toUpperCase())} {version.game_version}
          </p>
        </div>
        <div className="flex gap-1 justify-evenly">
          <Button size="sm"> <Play className="h-5 w-5 mr-1" /> Play</Button>
          <Button size="sm" className="w-ful"><Star className="h-5 w-5" /></Button>
          <Button size="sm" className="w-ful"><BookCopy className="h-5 w-5" /></Button>
        </div>

        <Separator />
        <ul className="space-y-2 px-4">
          <li>
            <Button className="w-full" variant="secondary" size="sm" asChild>
              <Link to="">Content</Link>
            </Button>

          </li>
          <li>
            <Button className="w-full" variant="secondary" size="sm" asChild>
              <Link to="">Screenshots</Link>
            </Button>
          </li>
          <li>
            <Button className="w-full" variant="secondary" size="sm" asChild>
              <Link to="">Logs</Link>
            </Button>
          </li>
          <li>
            <Button className="w-full" variant="secondary" size="sm" asChild>
              <Link to={`/profile/${id}/edit`}>Options</Link>
            </Button>
          </li>
        </ul>
      </div>

      <div className="col-span-9 ml-6 overflow-y-scroll scrollbar">
        <Outlet context={data} />
      </div>
    </div>
  );

  //const { validateMods } = useDownload();
  //   <ProfileCategories id={data.id} />
  /*return (
    <ScrollArea className="text-zinc-50">
      <div className="flex h-72 flex-col justify-between bg-blue-950">
        <div className="flex max-w-3xl flex-col p-2 xl:max-w-7xl">
          <TypographyH1 className="line-clamp-1">{data.name}</TypographyH1>

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
    </ScrollArea >
  );*/
};

/*

 {/*<Suspense
                fallback={
                  <Button disabled size="icon">
                    <LibraryBig />
                  </Button>
                }
              >
                <AddToCategory id={data.id} />
              </Suspense>/*}*/
export default Profile;
