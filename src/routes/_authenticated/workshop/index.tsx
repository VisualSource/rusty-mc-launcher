import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type UseNavigateResult, createFileRoute } from "@tanstack/react-router";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination"
import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { categoryList, loaderList, searchProjects, projectTypeList } from "@lib/api/modrinth/services.gen";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { z } from "zod";
import { useDebounce } from "use-debounce";
import { useEffect, useState } from "react";
import { WorkshopCard } from "@/components/workshop/WorkshopCard";
import { ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

const schemaSchema = z.object({
	query: z.ostring(),
	index: z.enum(["relevance", "downloads", "follows", "newest", "updated"]).catch("relevance"),
	offset: z.number().catch(0),
	limit: z.number().min(0).max(100).positive().int().catch(10),
	facets: z.array(z.array(z.string())).catch([[
		"categories:forge",
		"categories:fabric",
		"categories:quilt",
		"categories:modloader",
	], ["project_type:mod"]])
});

type SerachParams = z.infer<typeof schemaSchema>;

export const Route = createFileRoute("/_authenticated/workshop/")({
	component: WorkshopHome,
	validateSearch: (search) => schemaSchema.parse(search)
});

const CheckBoxItem: React.FC<{ navigate: UseNavigateResult<string>, type: string, label: string; id: string; icon?: string }> = ({
	label,
	id,
	icon,
	navigate
}) => {
	return (
		<div className="flex items-center space-x-2">
			<Checkbox onClick={() => navigate({
				search: (prev) => ({ ...prev })
			})} id={id} />
			<label
				htmlFor={id}
				className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
			>
				{icon ? (
					<span
						className="inline-block h-4 w-4"
						// biome-ignore lint/security/noDangerouslySetInnerHtml: thrid party icon
						dangerouslySetInnerHTML={{ __html: icon }}
					/>
				) : null}
				{label.replace(/^./, label[0].toUpperCase() ?? "")}
			</label>
		</div>
	);
};

const Pag = () => {
	return (
		<Pagination className="py-2">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious href="#" />
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">1</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#" isActive>
						2
					</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink href="#">3</PaginationLink>
				</PaginationItem>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				<PaginationItem>
					<PaginationNext href="#" />
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}

function WorkshopHome() {
	const search = Route.useSearch();
	const [query, setQuery] = useState<string>(search.query ?? "");
	const [queryValue] = useDebounce(query, 500);
	const navigate = Route.useNavigate();
	const categoires = useSuspenseQuery({
		queryKey: ["MODRINTH", "TAGS", "CATEGORIES"],
		queryFn: async () => {
			const list = await categoryList({
				client: modrinthClient,
			});
			if (list.error) throw list.error;
			if (!list.data) throw new Error("Failed to load categories")
			return list.data;
		},
	});
	const modrinthLoaders = useSuspenseQuery({
		queryKey: ["MODRINTH", "TAGS", "LOADERS"],
		queryFn: async () => {
			const list = await loaderList({
				client: modrinthClient,
			});
			if (list.error) throw list.error;
			if (!list.data) throw new Error("Failed to load categories")
			return list.data;
		},
	});
	const modrinthProjectTypes = useSuspenseQuery({
		queryKey: ["MODRINTH", "TAGS", "PROJECT_TYPES"],
		queryFn: async () => {
			const list = await projectTypeList({
				client: modrinthClient,
			});
			if (list.error) throw list.error;
			if (!list.data) throw new Error("Failed to load categories")
			return list.data.filter(e => e === "plugin");
		},
	});

	const results = useQuery({
		queryKey: ["MODRINTH", "SEARCH", search.query, search.index, search.limit, search.facets, search.offset],
		queryFn: async () => {
			const results = await searchProjects({
				client: modrinthClient,
				query: {
					query: search.query,
					facets: JSON.stringify(search.facets),
					offset: search.offset,
					limit: search.limit,
					index: search.index
				}
			});
			if (results.error) throw results.error;
			if (!results.data) throw new Error("Failed to load");
			return results.data;
		}
	});

	useEffect(() => {
		if (queryValue?.length) {
			navigate({
				search: prev => ({ ...prev, query: queryValue })
			})
		}
	}, [queryValue, navigate]);

	return (
		<div className="flex h-full overflow-hidden">
			<aside className="w-60 overflow-y-scroll h-full pl-4 space-y-4">
				<div className="space-y-2">
					<TypographyH3>Project Type</TypographyH3>
					<ul className="space-y-2">
						{modrinthProjectTypes.data

							?.map((item) => (
								<li key={item}>
									<CheckBoxItem type="project_type"
										navigate={navigate}

										label={item}
										icon={""}
										id={item}
									/>
								</li>
							))}
					</ul>
				</div>
				<div className="space-y-2">
					<TypographyH3>Categories</TypographyH3>
					<ul className="space-y-2">
						{categoires.data
							?.filter((e) => e.project_type === "mod")
							?.map((item) => (
								<li key={item.name}>
									<CheckBoxItem type="categories"
										navigate={navigate}

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
						{modrinthLoaders.data.filter(e => {
							return ["fabric", "forge", "neoforge", "quilt"].includes(e.name);
						})
							?.map((item) => (
								<li key={item.name}>
									<CheckBoxItem
										type="categories"
										navigate={navigate}
										label={item.name}
										icon={item.icon}
										id={item.name}
									/>
								</li>
							))}
					</ul>
				</div>
				<div className="space-y-2">
					<TypographyH4>Environments</TypographyH4>
					<ul className="space-y-2">
						<li>
							<CheckBoxItem label="Client" id="client" type="categories"
								navigate={navigate} />
						</li>
						<li>
							<CheckBoxItem label="Server" id="server" type="categories"
								navigate={navigate} />
						</li>
					</ul>
				</div>
			</aside>
			<div className="w-full h-full overflow-y-scroll">
				<header className="flex px-4 pt-4">
					<search className="flex w-full gap-4 items-center">
						<Input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Search..." />

						<Label className="text-nowrap">Sort By</Label>
						<Select onValueChange={(e) => navigate({
							search: prev => ({ ...prev, index: e as SerachParams["index"] })
						})} defaultValue="relevance">
							<SelectTrigger className="max-w-min">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="relevance">Relevance</SelectItem>
								<SelectItem value="downloads">Downloads</SelectItem>
								<SelectItem value="follows">Follows</SelectItem>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="updated">Updated</SelectItem>
							</SelectContent>
						</Select>

						<Label className="text-nowrap">Show pre page</Label>
						<Select onValueChange={(e) => navigate({
							search: prev => ({ ...prev, limit: Number.parseInt(e) })
						})} defaultValue="24">
							<SelectTrigger className="max-w-min">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="6">6</SelectItem>
								<SelectItem value="12">12</SelectItem>
								<SelectItem value="18">18</SelectItem>
								<SelectItem value="24">24</SelectItem>
								<SelectItem value="48">48</SelectItem>
								<SelectItem value="96">96</SelectItem>
							</SelectContent>
						</Select>
					</search>
				</header>
				<Pag />
				<div className="flex flex-wrap w-full gap-2 justify-center">
					{results.data?.hits.map(e => (
						<WorkshopCard project={e} key={e.project_id} />
					))}
				</div>
				<Pag />
			</div>
		</div>
	);
}

/*** 
 * 
 * 
 * 
 * 	<div className="flex h-full w-full">
			<aside className="w-52 space-y-2 overflow-y-scroll scrollbar">
				<div className="space-y-2">
					<TypographyH3>Categories</TypographyH3>
					<ul className="space-y-2">
						{categoires.data
							?.filter((e) => e.project_type === "mod")
							?.map((item) => (
								<li key={item.name}>
									<CheckBoxItem type="categories"
										navigate={navigate}

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
						{modrinthLoaders.data.filter(e => {
							return ["fabric", "forge", "neoforge", "quilt"].includes(e.name);
						})
							?.map((item) => (
								<li key={item.name}>
									<CheckBoxItem
										type="categories"
										navigate={navigate}
										label={item.name}
										icon={item.icon}
										id={item.name}
									/>
								</li>
							))}
					</ul>
				</div>
				<div className="space-y-2">
					<TypographyH4>Environments</TypographyH4>
					<ul className="space-y-2">
						<li>
							<CheckBoxItem label="Client" id="client" type="categories"
								navigate={navigate} />
						</li>
						<li>
							<CheckBoxItem label="Server" id="server" type="categories"
								navigate={navigate} />
						</li>
					</ul>
				</div>
			</aside>
			<section className="w-full flex flex-col">
				<header className="flex">
					<search className="flex w-full gap-4 items-center">
						<Input value={query} onChange={(ev) => setQuery(ev.target.value)} placeholder="Search..." />

						<Label className="text-nowrap">Sort By</Label>
						<Select onValueChange={(e) => navigate({
							search: prev => ({ ...prev, index: e as SerachParams["index"] })
						})} defaultValue="relevance">
							<SelectTrigger className="max-w-min">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="relevance">Relevance</SelectItem>
								<SelectItem value="downloads">Downloads</SelectItem>
								<SelectItem value="follows">Follows</SelectItem>
								<SelectItem value="newest">Newest</SelectItem>
								<SelectItem value="updated">Updated</SelectItem>
							</SelectContent>
						</Select>

						<Label className="text-nowrap">Show pre page</Label>
						<Select onValueChange={(e) => navigate({
							search: prev => ({ ...prev, limit: Number.parseInt(e) })
						})} defaultValue="24">
							<SelectTrigger className="max-w-min">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="6">6</SelectItem>
								<SelectItem value="12">12</SelectItem>
								<SelectItem value="18">18</SelectItem>
								<SelectItem value="24">24</SelectItem>
								<SelectItem value="48">48</SelectItem>
								<SelectItem value="96">96</SelectItem>
							</SelectContent>
						</Select>
					</search>
				</header>
				<div className="flex flex-col overflow-y-scroll scrollbar p-2">

					<div className="flex flex-wrap h-full">
						{results.data?.hits.map(e => (
							<WorkshopCard project={e} key={e.project_id} />
						))}
					</div>
					<Pag />
				</div>
			</section>
		</div>
 * 
 * 
*/

/*
<div className="flex justify-center items-center w-full">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious href="#" />
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">1</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#" isActive>
										2
									</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">3</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
								<PaginationItem>
									<PaginationNext href="#" />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>
<div className="flex justify-center items-center w-full py-2 flex-shrink-0 flex-grow-0">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious href="#" />
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">1</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#" isActive>
										2
									</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">3</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
								<PaginationItem>
									<PaginationNext href="#" />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>

					<div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 grid-rows-none grid-flow-row-dense w-full h-full flex-grow">
						{results.data?.hits.map(e => (
							<WorkshopCard project={e} key={e.project_id} />
						))}

					</div>

					<div className="flex justify-center items-center w-full py-2 flex-shrink-0 flex-grow-0">
						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious href="#" />
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">1</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#" isActive>
										2
									</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationLink href="#">3</PaginationLink>
								</PaginationItem>
								<PaginationItem>
									<PaginationEllipsis />
								</PaginationItem>
								<PaginationItem>
									<PaginationNext href="#" />
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</div>

*/