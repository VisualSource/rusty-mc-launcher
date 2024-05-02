import { Bug, Code, Download, Globe, Plus, Users2 } from "lucide-react";
import { Link, type To, useAsyncValue } from "react-router-dom";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { useState } from "react";

import { TypographyH1, TypographyH4 } from "@component/ui/typography";
import type { ModrinthProjectExtended } from "@lib/api/modrinth";
import useInstallContent from "@hook/useInstallContent";
import { ScrollArea } from "@component/ui/scroll-area";
import { Separator } from "@component/ui/separator";
import { Button } from "@component/ui/button";
import { Badge } from "@component/ui/badge";
import { cn } from "@lib/utils";

const ModrinthProject: React.FC = () => {
  const data = useAsyncValue() as ModrinthProjectExtended;
  const [image, setImage] = useState(0);

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
          <div>
            <TypographyH1>{data.title}</TypographyH1>
            <div>
              {data.categories.map((value, i) => (
                <Badge key={i}>{value}</Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="flex">
              <Users2 className="pr-2" /> {data.followers}
            </div>
            <div className="flex">
              <Download className="pr-2" />
              {data.downloads}{" "}
            </div>
          </div>
        </div>

        <section className="rounded-md bg-blue-900/20 p-2 shadow-2xl">
          {data.gallery?.length ? (
            <>
              <div className="h-96">
                {data.gallery[image] ? (
                  <img
                    className="h-full w-full object-contain"
                    src={data.gallery[image].url}
                    alt={data.gallery[image].title}
                  />
                ) : null}
              </div>
              <Separator className="my-4" />
              <div className="flex gap-2">
                {data.gallery.map((value, i) => (
                  <button
                    onClick={() => setImage(i)}
                    className={cn("h-24", {
                      "rounded-sm border border-blue-700 shadow-2xl":
                        i === image,
                    })}
                    key={value.ordering}
                  >
                    <img
                      src={value.url}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
              <Separator className="my-4" />
            </>
          ) : null}
          <div className="flex flex-wrap gap-2 p-4">
            {data.source_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.source_url}
                className="flex"
              >
                <Code className="pr-2" />{" "}
                <span className="text-blue-600 underline">Source</span>{" "}
              </a>
            ) : null}
            {data.issues_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.issues_url}
                className="flex"
              >
                {" "}
                <Bug className="pr-2" />{" "}
                <span className="text-blue-600 underline">Issues</span>{" "}
              </a>
            ) : null}
            {data.wiki_url ? (
              <a
                rel="noopener noreferrer"
                target="_blank"
                href={data.wiki_url}
                className="flex"
              >
                {" "}
                <Globe className="pr-2" />{" "}
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
                <DiscordLogoIcon />{" "}
                <span className="pl-2 text-blue-600 underline">Discord</span>
              </a>
            ) : null}
            {data.donation_urls
              ? data.donation_urls.map((value) => (
                  <a
                    href={value.url}
                    target="_blank"
                    key={value.id}
                    className="flex"
                    rel="noopener noreferrer"
                  >
                    <span className="text-blue-600 underline">
                      {value.platform}
                    </span>{" "}
                  </a>
                ))
              : null}
          </div>
        </section>

        <div className="grid grid-cols-4 gap-8 pt-4">
          <div className="col-span-3 flex flex-col gap-4">
            <section className="flex justify-between rounded-md bg-blue-900/20 p-4 shadow-2xl">
              <TypographyH4>{data.title}</TypographyH4>

              <Button
                onClick={() =>
                  installContent(data.slug, data.project_type, {
                    minecraft_versions: data?.game_versions,
                    modloaders: data?.loaders,
                    name: data.title,
                  })
                }
              >
                <Plus /> Install
              </Button>
            </section>
            <article className="prose prose-invert mb-4 max-w-none">
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                remarkPlugins={[remarkGfm]}
              >
                {data.body}
              </ReactMarkdown>
            </article>
          </div>
          <div className="col-span-1 flex flex-col gap-2">
            <div>
              <TypographyH4>Create By</TypographyH4>
              {data.team}
            </div>

            <div>
              <TypographyH4>License</TypographyH4>
              <a
                rel="noopener noreferrer"
                className="text-blue-600 underline"
                href={data.license?.url ?? ""}
              >
                {data.license.name}
              </a>
            </div>

            <div>
              <TypographyH4>Supports</TypographyH4>
              <p>Client Side: {data.client_side}</p>
              <p>Server Side: {data.server_side}</p>
            </div>

            <div>
              <TypographyH4>Mod Loaders</TypographyH4>
              <div>
                {data.loaders.map((value, i) => (
                  <Badge key={i}>{value}</Badge>
                ))}
              </div>
            </div>

            <div>
              <TypographyH4>Versions</TypographyH4>
              <div>
                {data.game_versions.map((value, i) => (
                  <Badge key={i}>{value}</Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default ModrinthProject;
