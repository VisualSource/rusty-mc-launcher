import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Suspense, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";
import { Filter } from "lucide-react";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TagsService } from "@lib/api/modrinth/services.gen";
import type { IndexType } from "@/lib/api/modrinth";
import { Checkbox } from "@/components/ui/checkbox";
import { TypographyH3 } from "../ui/typography";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

const CheckBoxItem: React.FC<{ label: string; id: string; icon?: string }> = ({
  label,
  id,
  icon,
}) => {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox id={id} />
      <label
        htmlFor={id}
        className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
      >
        {icon ? (
          <span
            className="inline-block h-4 w-4"
            dangerouslySetInnerHTML={{ __html: icon }}
          ></span>
        ) : null}
        {label.replace(/^./, label[0].toUpperCase() ?? "")}
      </label>
    </div>
  );
};

const ProjectTypeList = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const projectType = useSuspenseQuery({
    queryKey: ["modrinth", "tags", "project_type"],
    queryFn: () => TagsService.projectTypeList(),
  });

  return (
    <Select
      onValueChange={(value) => {
        setSearchParams((prev) => {
          prev.set("facets", JSON.stringify([[`project_type:${value}`]]));
          return prev;
        });
        navigate({
          pathname: "/workshop/search",
          search: searchParams.toString(),
        });
      }}
      defaultValue={projectType.data[0] ?? "mod"}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {projectType.data.map((type) => (
            <SelectItem key={type} value={type}>
              View: {type.replace(/^./, type[0].toUpperCase() ?? "")}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
};

const SearchBar = () => {
  const categoires = useQuery({
    queryKey: ["modrinth", "tags", "categoires"],
    queryFn: () => TagsService.categoryList(),
  });
  const loaders = useQuery({
    queryKey: ["modrinth", "tags", "loaders"],
    queryFn: () => TagsService.loaderList(),
  });

  const [searchParams, _] = useSearchParams();
  const navigate = useNavigate();
  const [search, setSearch] = useState<string>("");
  const [query] = useDebounce(search, 500);
  const [searchBy, setSearchBy] = useState<IndexType>(
    (searchParams.get("index") as IndexType) ?? "relevance",
  );

  useEffect(() => {
    if (query.length) {
      searchParams.set("query", query);

      navigate({
        pathname: "/workshop/search",
        search: searchParams.toString(),
      });
    }
  }, [query]);

  return (
    <section className="flex justify-center shadow-xl">
      <search className="flex w-2/3 gap-2 p-2">
        <Input
          value={search}
          onChange={(ev) => setSearch(ev.target.value)}
          placeholder="Search"
        />
        <Select
          value={searchBy}
          onValueChange={(value) => {
            searchParams.set("index", value);
            navigate({
              pathname: "/workshop/search",
              search: searchParams.toString(),
            });
            setSearchBy(value as IndexType);
          }}
          defaultValue="relevance"
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="downloads">Download Count</SelectItem>
              <SelectItem value="follows">Follow Count</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="updated">Recently updated</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <Suspense>
          <ProjectTypeList />
        </Suspense>

        <Popover>
          <PopoverTrigger asChild>
            <Button>
              <Filter className="mr-2 h-5 w-5" /> Filter
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <ScrollArea className="h-96">
              <div className="space-y-2">
                <TypographyH3>Categoires</TypographyH3>
                <ul className="space-y-2">
                  {categoires.data
                    ?.filter((e) => e.project_type === "mod")
                    ?.map((item) => (
                      <li key={item.name}>
                        <CheckBoxItem
                          label={item.name}
                          icon={item.icon}
                          id={item.name}
                        />
                      </li>
                    ))}
                </ul>
              </div>
              <div className="space-y-2">
                <TypographyH3>Loaders</TypographyH3>
                <ul className="space-y-2">
                  {loaders.data
                    ?.filter(
                      (e) =>
                        e.supported_project_types.includes("mod") &&
                        e.supported_project_types.includes("modpack"),
                    )
                    .map((e) => (
                      <li key={e.name}>
                        <CheckBoxItem
                          label={e.name}
                          icon={e.icon}
                          id={e.name}
                        />
                      </li>
                    ))}
                </ul>
              </div>
              <div className="space-y-2">
                <TypographyH3>Environments</TypographyH3>
                <ul className="space-y-2">
                  <li>
                    <CheckBoxItem label="Client" id="client" />
                  </li>
                  <li>
                    <CheckBoxItem label="Server" id="client" />
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <TypographyH3>Open source</TypographyH3>
                <CheckBoxItem label="Open source only" id="open_source_only" />
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </search>
    </section>
  );
};

export default SearchBar;
