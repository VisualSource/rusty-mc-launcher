
import { useQuery } from '@tanstack/react-query';
import { Link } from "react-router-dom";

import { ScrollArea, ScrollBar } from "@component/ui/scroll-area";
import { ProjectsService } from "@lib/api/modrinth/services.gen";
import { TypographyH3 } from "../ui/typography";
import { Separator } from '../ui/separator';
import Search from './Search';

const Workshop = () => {
    const newReleases = useQuery({
        queryKey: ["modrinth", "new_releases"],
        queryFn: () => ProjectsService.searchProjects({
            limit: 10,
            index: "newest",
        })
    })
    const popular = useQuery({
        queryKey: ["modrinth", "relevance"],
        queryFn: () => ProjectsService.searchProjects({
            limit: 10,
            index: "relevance",
        })
    });

    return (
        <div className="flex flex-col overflow-hidden" style={{ height: "calc(100vh - 88px - 64px)" }}>
            <Search />
            <div className="px-6 overflow-y-scroll scrollbar">
                <section className="h-64 flex flex-col">
                    <TypographyH3>Popular</TypographyH3>
                    <Separator />
                    {popular.isLoading ? (
                        <div>Loading</div>
                    ) : popular.isError ? (<div>{popular?.error.message}</div>) : (
                        <ScrollArea className="whitespace-nowrap">
                            <div className="flex w-max space-x-6 p-4">
                                {popular.data?.hits.map((item) => (
                                    <Link className="flex p-2" to={`/workshop/${item.project_id}`} key={item.project_id}>
                                        <div className="h-40 w-40">
                                            <img className="h-full w-full" alt={item.title} src={item.icon_url ?? undefined} />
                                        </div>
                                        <div className="ml-2">
                                            <h1 className="font-bold text-lg"> {item.title}</h1>

                                            <p className="w-60 text-sm text-wrap">{item.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>)}
                </section>

                <section className="h-64 flex flex-col">
                    <TypographyH3>Newest</TypographyH3>
                    <Separator />
                    {newReleases.isLoading ? (
                        <div>Loading</div>
                    ) : newReleases.isError ? (<div>{newReleases?.error.message}</div>) : (
                        <ScrollArea className="whitespace-nowrap">
                            <div className="flex w-max space-x-6 p-4">
                                {newReleases.data?.hits.map((item) => (
                                    <Link className="flex p-2" to={`/workshop/${item.project_id}`} key={item.project_id}>
                                        <div className="h-40 w-40">
                                            <img className="h-full w-full" alt={item.title} src={item.icon_url ?? undefined} />
                                        </div>
                                        <div className="ml-2">
                                            <h1 className="font-bold text-lg"> {item.title}</h1>

                                            <p className="w-60 text-sm text-wrap">{item.description}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                            <ScrollBar orientation="horizontal" />
                        </ScrollArea>)}
                </section>
            </div>
        </div>
    );
}

export default Workshop;
