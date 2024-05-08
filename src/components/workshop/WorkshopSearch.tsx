import {
  Await,
  ScrollRestoration,
  useLoaderData,
} from "react-router-dom";
import { Suspense } from "react";

import WorkshopSearchResults from "./WorkshopSearchResults";
import { ScrollArea } from "@component/ui/scroll-area";
import SearchBar from "./SearchBar";

const WorkshopSearch: React.FC = () => {
  const data = useLoaderData();

  return (
    <div className="flex h-full flex-col gap-2 bg-zinc-950">
      <ScrollRestoration />
      <SearchBar />
      <ScrollArea>
        <div className="bg-zinc-900 h-full py-2">
          <Suspense fallback={<>Loading...</>}>
            <Await resolve={data}>
              <WorkshopSearchResults />
            </Await>
          </Suspense>
        </div>
      </ScrollArea>
    </div>
  );
};

export default WorkshopSearch;
