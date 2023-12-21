import {
  Await,
  ScrollRestoration,
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
} from "@component/ui/select";
import type { ModrinthApiSearchResponse } from "@lib/api/modrinth";
import WorkshopSearchResults from "./WorkshopSearchResults";
import { ScrollArea } from "@component/ui/scroll-area";
import { Input } from "@component/ui/input";

const WorkshopSearch: React.FC = () => {
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
      <search className="grid grid-cols-12 text-zinc-50 py-2 px-4 gap-2 row-span-1">
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
      </search>
      <ScrollArea>
        <Suspense fallback={<>Loading...</>}>
          <Await resolve={data}>
            <WorkshopSearchResults
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

export default WorkshopSearch;
