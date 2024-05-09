import { Bug, Calendar, Code, DollarSign, Download, Globe, Heart, Plus, RefreshCcw } from "lucide-react";
import { Link, type To, useAsyncValue } from "react-router-dom";
import { formatRelative } from "date-fns/formatRelative";
import { useSuspenseQuery } from "@tanstack/react-query";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import ReactMarkdown from "react-markdown";
import { Suspense, useState } from "react";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

import { TeamsService } from "@lib/api/modrinth/services.gen";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyH1, TypographyH4 } from "@component/ui/typography";
import type { Project } from "@lib/api/modrinth/types.gen";
import useInstallContent from "@hook/useInstallContent";
import { ScrollArea } from "@component/ui/scroll-area";
import { Separator } from "@component/ui/separator";
import { Button } from "@component/ui/button";
import { Badge } from "@component/ui/badge";

const Team: React.FC<{ id: string }> = ({ id }) => {
  const { data } = useSuspenseQuery({
    queryKey: ["modrinth", "team", id],
    queryFn: () => TeamsService.getTeamMembers({ id })
  })

  return (
    <ul className="space-y-2">
      {data.toSorted((a, b) => (b.ordering ?? 0) - (a.ordering ?? 0)).map(e => (
        <div key={e.user.id} className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback></AvatarFallback>
            <AvatarImage src={e.user.avatar_url} />
          </Avatar>
          <div>
            <h5 className="line-clamp-1 font-bold">{e.user.username}</h5>
            <p className="line-clamp-1 italic text-sm">{e.role}</p>
          </div>
        </div>
      ))}
    </ul>
  );
}

const Gallery: React.FC<{ gallery: NonNullable<Project["gallery"]> }> = ({ gallery }) => {
  const [api, setApi] = useState<CarouselApi>();

  const images = gallery.toSorted((a, b) => (b?.ordering ?? 0) - (a?.ordering ?? 0));

  return (
    <Carousel setApi={setApi}>
      <CarouselContent>
        {images.map((item, i) => (
          <CarouselItem key={i}>
            <div className="h-96">
              <img className="w-full h-full object-contain object-center" src={item?.url} alt={item?.title ?? `Gallery Image ${i}`} />
            </div>
          </CarouselItem>

        ))}
      </CarouselContent>

      <Separator className="my-4" />

      <div className="relative flex justify-between items-center px-6">
        <CarouselPrevious className="relative top-0 left-0 right-0 bottom-0 translate-y-0" />

        <div className="flex gap-4 overflow-hidden">
          {images.slice(0, 6).map((item, i) => (
            <button onClick={() => api?.scrollTo(i)} className="h-28 w-28">
              <img className="w-full h-full object-contain object-center" src={item?.url} alt={item?.title ?? `Gallery Image ${i}`} />
            </button>
          ))}
        </div>
        <CarouselNext className="relative top-0 left-0 right-0 bottom-0 translate-y-0" />
      </div>
      <Separator className="my-4" />

    </Carousel>
  );
}

const ModrinthProject: React.FC = () => {
  const data = useAsyncValue() as Project;

  const installContent = useInstallContent();

  return (
    <ScrollArea>
      <div className="p-3">
        <Button asChild>
          <Link to={-1 as To}>Back</Link>
        </Button>
      </div>
      <div className="container flex flex-col text-zinc-50">
        <div className="flex justify-between py-4">
          <TypographyH1>{data.title}</TypographyH1>
        </div>


        <section className="rounded-md bg-blue-900/10 p-2 shadow-2xl">
          {data.gallery ? (<Gallery gallery={data.gallery} />) : null}

          <div className="flex flex-wrap gap-2 p-4">
            {data.source_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.source_url}
                className="flex items-center"
              >
                <Code className="pr-2" />
                <span className="text-blue-600 underline">Source</span>
              </a>
            ) : null}
            {data.issues_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.issues_url}
                className="flex items-center"
              >
                <Bug className="pr-2" />
                <span className="text-blue-600 underline">Issues</span>
              </a>
            ) : null}
            {data.wiki_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.wiki_url}
                className="flex"
              >
                <Globe className="pr-2" />
                <span className="text-blue-600 underline">Wiki</span>
              </a>
            ) : null}
            {data.discord_url ? (
              <a
                target="_blank"
                rel="noopener noreferrer"
                href={data.discord_url}
                className="flex items-center"
              >
                <DiscordLogoIcon />
                <span className="pl-2 text-blue-600 underline">Discord</span>
              </a>
            ) : null}
            {data.donation_urls
              ? data.donation_urls.map((value) => (
                <a
                  href={value.url}
                  target="_blank"
                  key={value.id}
                  className="flex items-center"
                  rel="noopener noreferrer"
                >
                  <DollarSign className="pr-2" />
                  <span className="text-blue-600 underline">
                    {value.platform ? "Donate" : value.platform === "Other" ? "Donate" : value.platform}
                  </span>
                </a>
              ))
              : null}
          </div>
        </section>

        <div className="grid grid-cols-4 gap-8 pt-4">
          <div className="col-span-3 flex flex-col gap-4">
            <section className="flex justify-between rounded-md bg-blue-900/10 p-4 shadow-2xl">
              <TypographyH4>{data.title}</TypographyH4>

              <div className="flex items-center gap-2">

                <Button variant='secondary'>
                  <Heart className="h-5 w-5 mr-1" /> Follow
                </Button>
                <Button
                  onClick={() =>
                    installContent(data.id, data.project_type, {
                      minecraft_versions: data?.game_versions,
                      modloaders: data?.loaders,
                      name: data?.title ?? data.id,
                    })
                  }
                >
                  <Plus className="mr-1" /> Install
                </Button>
              </div>


            </section>
            <article className="prose prose-invert mb-4 max-w-none">
              <ReactMarkdown
                components={{
                  a: ({ children, href }) => (<a target="_blank" rel="noopener noreferrer" href={href}>{children}</a>)
                }}
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
              >
                {data.body}
              </ReactMarkdown>
            </article>
          </div>

          <div className="col-span-1 flex flex-col gap-2">

            <section className="space-y-2">
              <TypographyH4>Details</TypographyH4>
              <div className="flex items-center gap-1">
                <Download className="h-5 w-5" />
                <span className="font-bold">{data.downloads.toLocaleString(undefined, {
                  notation: "compact",
                  maximumFractionDigits: 2
                })}</span>
                Downloads
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-5 w-5" />
                <span className="font-bold">{data.followers.toLocaleString(undefined, {
                  notation: "compact",
                  maximumFractionDigits: 1
                })}</span>
                followers
              </div>

              <div className="flex gap-1 items-center">
                <Calendar className="h-5 w-5" />
                <span className="font-bold">Created</span>
                {formatRelative(data.published, new Date())}
              </div>
              <div className="flex gap-1 items-center">
                <RefreshCcw className="h-5 w-5" />
                <span className="font-bold">Updated</span>
                {formatRelative(data.updated, new Date())}
              </div>

              <div className="flex gap-1 items-center">
                <span className="font-bold">Project Id:</span>
                <span className="italic text-sm bg-zinc-600 rounded-md px-2">{data.id}</span>
              </div>
            </section>

            <section className="space-y-2">
              <TypographyH4>Project members</TypographyH4>
              <Suspense>
                <Team id={data.team} />
              </Suspense>
            </section>

            {data.license ? (
              <section>
                <TypographyH4>License</TypographyH4>
                <a
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline text-sm"
                  href={data.license.url ?? ""}
                >
                  {data.license.name}
                </a>
              </section>
            ) : null}

            <section>
              <TypographyH4>Supports</TypographyH4>
              <p className="text-sm">Client Side: {data.client_side}</p>
              <p className="text-sm">Server Side: {data.server_side}</p>
            </section>

            {data.loaders ? (
              <section>
                <TypographyH4>Mod Loaders</TypographyH4>
                <div>
                  {data.loaders?.map((value, i) => (
                    <Badge key={i}>{value}</Badge>
                  ))}
                </div>
              </section>
            ) : null}

            {data.game_versions ? (<section>
              <TypographyH4>Versions</TypographyH4>
              {data.game_versions.slice(0, 6).map((value, i) => (
                <Badge key={i}>{value}</Badge>
              ))}
              <details>
                <summary>
                  View More
                </summary>
                {data.game_versions.slice(6).map((value, i) => (
                  <Badge key={i}>{value}</Badge>
                ))}
              </details>
            </section>) : null}

          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ModrinthProject;
