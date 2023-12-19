import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { Suspense, useState } from "react";
import { Await, Link, useAsyncValue, useLoaderData } from "react-router-dom";
import { ModrinthProjectExtended } from "@/lib/api/modrinth";

import { TypographyH1, TypographyH4 } from "../ui/typography";
import { ScrollArea } from "../ui/scroll-area";
import { Bug, Code, Download, Globe, Plus, Users2 } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { DiscordLogoIcon } from "@radix-ui/react-icons";
import { Separator } from "../ui/separator";
import { cn } from "@/lib/utils";

type DeferredRouteData = {
    content: Promise<{}>
}

const ModrinthPage: React.FC = () => {
    const data = useLoaderData() as DeferredRouteData;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Suspense fallback={<></>}>
                <Await resolve={data}>
                    <ModrinthContent />
                </Await>
            </Suspense>
        </div>
    );
}



const ModrinthContent: React.FC = () => {
    const [image, setImage] = useState(0);

    const data = useAsyncValue() as ModrinthProjectExtended;

    return (
        <ScrollArea>
            <div className="p-3">
                <Button asChild>
                    <Link to="/workshop">Back</Link>
                </Button>
            </div>
            <div className="flex flex-col text-zinc-50 container">
                <div className="py-4 flex justify-between">
                    <div>
                        <TypographyH1>{data.title}</TypographyH1>
                        <div>
                            {data.categories.map((value, i) => (<Badge key={i}>{value}</Badge>))}
                        </div>
                    </div>
                    <div>
                        <div className="flex"><Users2 className="pr-2" /> {data.followers}</div>
                        <div className="flex"><Download className="pr-2" />{data.downloads} </div>
                    </div>
                </div>

                <section className="p-2 bg-blue-900/20 shadow-2xl rounded-md">
                    {data.gallery ? (
                        <>
                            <div className="h-96">
                                {data.gallery[image] ? (
                                    <img className="h-full w-full object-contain" src={data.gallery[image].url} alt={data.gallery[image].title} />
                                ) : null}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex gap-2">
                                {data.gallery.map((value, i) => (
                                    <button onClick={() => setImage(i)} className={cn("h-24", { "border border-blue-700 shadow-2xl rounded-sm": i === image })} key={value.ordering}>
                                        <img src={value.url} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                            <Separator className="my-4" />
                        </>
                    ) : null}
                    <div className="flex flex-wrap p-4 gap-2">
                        {data.source_url ? (<a href={data.source_url} className="flex"><Code className="pr-2" /> <span className="underline text-blue-600">Source</span> </a>) : null}
                        {data.issues_url ? (<a href={data.issues_url} className="flex"> <Bug className="pr-2" /> <span className="underline text-blue-600">Issues</span> </a>) : null}
                        {data.wiki_url ? (<a href={data.wiki_url} className="flex"> <Globe className="pr-2" /> <span className="underline text-blue-600">Wiki</span></a>) : null}
                        {data.discord_url ? (<a href={data.discord_url} className="flex items-center"><DiscordLogoIcon /> <span className="underline pl-2 text-blue-600">Discord</span></a>) : null}
                        {data.donation_urls ? (data.donation_urls.map((value) => (
                            <a href={value.url} target="blank" key={value.id} className="flex"><span className="underline text-blue-600">{value.platform}</span> </a>
                        ))) : null}
                    </div>
                </section>

                <div className="grid grid-cols-4 gap-8 pt-4">
                    <div className="col-span-3 flex flex-col gap-4">
                        <section className="p-4 flex justify-between bg-blue-900/20 shadow-2xl rounded-md">
                            <TypographyH4>{data.title}</TypographyH4>

                            <Button><Plus /> Install</Button>
                        </section>
                        <article className="prose max-w-none prose-invert mb-4">
                            <ReactMarkdown rehypePlugins={[rehypeRaw]} remarkPlugins={[remarkGfm]}>
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
                            <a className="underline text-blue-600" href={data.license?.url ?? ""}>{data.license.name}</a>
                        </div>

                        <div>
                            <TypographyH4>Supports</TypographyH4>
                            <p>Client Side: {data.client_side}</p>
                            <p>Server Side: {data.server_side}</p>
                        </div>

                        <div>
                            <TypographyH4>Mod Loaders</TypographyH4>
                            <div>
                                {data.loaders.map((value, i) => (<Badge key={i}>{value}</Badge>))}
                            </div>
                        </div>

                        <div>
                            <TypographyH4>Versions</TypographyH4>
                            <div>
                                {data.game_versions.map((value, i) => (<Badge key={i}>{value}</Badge>))}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

export default ModrinthPage;