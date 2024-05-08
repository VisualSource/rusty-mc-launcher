import { Link, To, useAsyncValue, useSearchParams } from "react-router-dom";
import { formatRelative } from 'date-fns/formatRelative';
import { Card, CardContent, CardHeader } from "@component/ui/card";
import type { SearchResults } from "@lib/api/modrinth/types.gen";
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
import { TypographyH3 } from "../ui/typography";
import { Download, Heart, RefreshCcw } from "lucide-react";

const next = (params: URLSearchParams, offset: number) => {
  params.set("offset", (offset + 18).toString());
  return params.toString();
}

const page = (total: number, limit: number, offset: number) => {
  return offset >= total ? 1 : Math.ceil(offset / limit) + 1;
}

const range = (start: number, end: number, step: number = 1) => {
  return Array(end - start + 1).fill(0).map((_, idx) => start + (idx * step));
}

const WorkshopSearchResults: React.FC = () => {
  const [params] = useSearchParams();
  const data = useAsyncValue() as SearchResults;

  const maxPages = page(data.total_hits, data.limit, data.total_hits - data.limit);
  const currentPage = page(data.total_hits, data.limit, data.offset);

  return (
    <>
      <div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-3 xl:grid-cols-3">
        {data.hits.map((project) => (
          <Link key={project.project_id} to={`/workshop/${project.project_id}`}>
            <Card className="h-full">
              <CardHeader className="flex-row space-y-0 gap-4 pb-2">

                <div className="h-24 w-24 bg-gray-100">
                  <img className="h-full w-full" src={project.icon_url ?? ""} />
                </div>
                <div>
                  <TypographyH3>{project.title}</TypographyH3>
                  <span className="text-sm text-zinc-300">By <span className="underline">{project.author}</span></span>
                </div>

              </CardHeader>
              <CardContent className="flex flex-col flex-grow">
                <div className="col-span-3 flex flex-col gap-2">
                  <p className="line-clamp-5">{project.description}</p>

                  <div className="flex flex-wrap">
                    {project.display_categories?.map((value, i) => (
                      <Badge key={i}>{value}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex  items-center">
                      <Download className="h-5 w-5 mr-1" />
                      <span className="font-bold text-lg">
                        {project.downloads.toLocaleString(undefined, {
                          notation: "compact",
                          maximumFractionDigits: 2
                        })}
                      </span>
                    </div>
                    <div className="flex  items-center">
                      <Heart className="h-5 w-5 mr-1" />
                      <span className="font-bold text-lg">{project.follows.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center mt-auto">
                    <RefreshCcw className="h-5 w-5 mr-1" />
                    {formatRelative(project.date_modified, new Date())}
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
            <PaginationPrevious to={{ search: `offset=${data.offset - data.limit}` }} />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink isActive={currentPage === 1} to={{}}>1</PaginationLink>
          </PaginationItem>

          {currentPage <= 5 ? (
            <>
              {range(1, 5, data.limit).map((offset) => (
                <PaginationItem key={`offset_${offset}`}>
                  <PaginationLink isActive={currentPage === page(data.total_hits, data.limit, offset)} to={{ search: `offset=${offset}` }}>{page(data.total_hits, data.limit, offset)}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          ) : (
            <>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              {range(-1, 1, 18).map((offset) => (
                <PaginationItem key={`offset_${offset + data.offset}`}>
                  <PaginationLink isActive={currentPage === page(data.total_hits, data.limit, offset + data.offset)} to={{ search: `offset=${(offset + data.offset)}` }}>{page(data.total_hits, data.limit, offset + data.limit)}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
            </>
          )}

          <PaginationItem>
            <PaginationLink isActive={currentPage === maxPages} to={{ search: `offset=${data.total_hits - 18}` }}>{maxPages}</PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationNext to={{
              pathname: "/workshop/search",
              search: `offset=${data.offset + data.limit}`
            }} />
          </PaginationItem>

        </PaginationContent>
      </Pagination>
    </>
  );
};

export default WorkshopSearchResults;
