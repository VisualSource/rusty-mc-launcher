import {
  Await,
  Link,
  ScrollRestoration,
  useAsyncValue,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import type {
  ModrinthApiSearchResponse,
  ModrinthProject,
} from "@/lib/api/modrinth";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

const WorkshopIndex: React.FC = () => {
  const [search, setSearch] = useState<string>("");
  const [searchParams, _] = useSearchParams();
  const [query] = useDebounce(search, 500);
  const navigate = useNavigate();
  const data = useLoaderData() as ModrinthApiSearchResponse;

  useEffect(() => {
    if (query.length > 4) {
      searchParams.set("query", query);
      searchParams.set("offset", "0");
      navigate({
        pathname: "/workshop",
        search: searchParams.toString(),
      });
    } else {
      if (searchParams.has("query")) {
        searchParams.set("offset", "0");
        searchParams.delete("query");
        navigate({
          pathname: "/workshop",
          search: searchParams.toString(),
        });
      }
    }
  }, [query]);

  return (
    <div className="h-full flex flex-col gap-2">
      <ScrollRestoration />
      <form className="grid grid-cols-12 text-zinc-50 py-2 px-4 gap-2 row-span-1">
        <Input
          onChange={(ev) => setSearch(ev.target.value)}
          value={search}
          className="col-span-6"
          placeholder="Search"
        />
        <Select
          defaultValue="project_type:mod"
          onValueChange={(ev) => {
            searchParams.set("facets", JSON.stringify([[ev]]));
            searchParams.set("offset", "0");
            navigate({
              pathname: "/workshop",
              search: searchParams.toString(),
            });
          }}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="View: Mods" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="project_type:mod">View: Mods</SelectItem>
            <SelectItem value="project_type:modpack">View: Modpacks</SelectItem>
            <SelectItem value="project_type:resourcepack">
              View: Resourcepacks
            </SelectItem>
            <SelectItem value="project_type:shader">
              View: Shaderpacks
            </SelectItem>
          </SelectContent>
        </Select>
        <Select
          onValueChange={(ev) => {
            searchParams.set("index", ev);
            searchParams.set("offset", "0");
            navigate({
              pathname: "/workshop",
              search: searchParams.toString(),
            });
          }}
        >
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Sort By: Relevance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relevance">Sort By: Relevance</SelectItem>
            <SelectItem value="downloads">Sort By: Downloads</SelectItem>
            <SelectItem value="follows">Sort By: Follows</SelectItem>
            <SelectItem value="newest">Sort By: Newest</SelectItem>
            <SelectItem value="updated">Sort By: Updated</SelectItem>
          </SelectContent>
        </Select>
      </form>
      <ScrollArea>
        <Suspense fallback={<>Loading...</>}>
          <Await resolve={data}>
            <DisplayResults
              nextParams={() => {
                const offset = searchParams.get("offset");
                const value = offset ? parseInt(offset) + 21 : 0;
                if (value < data.total_hits) {
                  searchParams.set("offset", value.toString());
                }

                return searchParams.toString();
              }}
              prevParams={() => {
                const offset = searchParams.get("offset");
                if (offset && offset !== "0") {
                  searchParams.set(
                    "offset",
                    (parseInt(offset) - 21).toString(),
                  );
                }
                return searchParams.toString();
              }}
            />
          </Await>
        </Suspense>
      </ScrollArea>
    </div>
  );
};

const DisplayResults: React.FC<{
  nextParams: () => string;
  prevParams: () => string;
}> = ({ nextParams, prevParams }) => {
  const data = useAsyncValue() as { hits: ModrinthProject[] };
  return (
    <>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 grid-flow-row gap-4 px-4">
        {data.hits.map((project) => (
          <Link key={project.project_id} to={`/workshop/${project.project_id}`}>
            <Card className="h-full">
              <CardHeader>
                <CardTitle>
                  {project.title} - {project.author}
                </CardTitle>
                <div className="flex flex-wrap">
                  {project.display_categories.map((value, i) => (
                    <Badge key={i}>{value}</Badge>
                  ))}
                </div>
              </CardHeader>
              <CardContent className="grid grid-cols-5 gap-2 h-full">
                <div className="col-span-2">
                  <img className="w-40 h-40" src={project.icon_url} />
                </div>
                <div className="col-span-3 flex flex-col gap-2">
                  <p className="line-clamp-5">{project.description}</p>

                  <div className="mb-4">
                    {project.versions
                      .toReversed()
                      .slice(0, 8)
                      .map((value, i) => (
                        <Badge key={i}>{value}</Badge>
                      ))}
                    {project.versions.length > 8 ? (
                      <Badge>{project.versions.length - 8} More Versions</Badge>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      <div className="w-full flex justify-center gap-8 pb-2 px-4 pt-4">
        <Button title="Prev Page" asChild>
          <Link
            to={{
              pathname: "/workshop",
              search: prevParams(),
            }}
          >
            Back
          </Link>
        </Button>
        <Button title="Next Page" asChild>
          <Link
            preventScrollReset={false}
            to={{
              pathname: "/workshop",
              search: nextParams(),
            }}
          >
            Next
          </Link>
        </Button>
      </div>
    </>
  );
};

export default WorkshopIndex;
