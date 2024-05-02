import { Link, To, useAsyncValue, useSearchParams } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@component/ui/card";
import type { ModrinthApiSearchResponse } from "@lib/api/modrinth";
import { Badge } from "@component/ui/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "../ui/pagination";

const WorkshopSearchResults: React.FC = () => {
  const [props] = useSearchParams();
  const data = useAsyncValue() as ModrinthApiSearchResponse;
  return (
    <>
      <div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-2 xl:grid-cols-3">
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
              <CardContent className="grid h-full grid-cols-5 gap-2">
                <div className="col-span-2">
                  <img className="h-40 w-40" src={project.icon_url} />
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
      <Pagination className="pt-4">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              to={
                props.get("offset") === "0"
                  ? (-1 as To)
                  : { pathname: "/workshop" }
              }
            />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext
              to={{
                pathname: "/workshop",
                search: (() => {
                  props.set("offset", (data.offset + 21).toString());
                  return props.toString();
                })(),
              }}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </>
  );
};

export default WorkshopSearchResults;
