import { Link, useAsyncValue } from "react-router-dom";

import { Card, CardContent, CardHeader, CardTitle } from "@component/ui/card";
import type { ModrinthProject } from "@lib/api/modrinth";
import { Button } from "@component/ui/button";
import { Badge } from "@component/ui/badge";

type SearchResultProps = {
  nextParams: () => string;
  prevParams: () => string;
};

const WorkshopSearchResults: React.FC<SearchResultProps> = ({
  nextParams,
  prevParams,
}) => {
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

export default WorkshopSearchResults;
