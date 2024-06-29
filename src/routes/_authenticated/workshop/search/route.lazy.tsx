import {
	createLazyFileRoute,
	Link,
	ErrorComponent,
	useLocation,
} from "@tanstack/react-router";
import {
	Activity,
	Download,
	FileImage,
	Heart,
	Sparkles,
	TriangleAlert,
} from "lucide-react";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { formatRelative } from "date-fns/formatRelative";
import { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import {
	categoryList,
	loaderList,
	searchProjects,
	projectTypeList,
} from "@lib/api/modrinth/services.gen";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { WorkshopPagination } from "@/components/workshop/WorkshopPagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { CategoryTag, LoaderTag } from "@/lib/api/modrinth/types.gen";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Selectable } from "@/components/workshop/Selectable";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModrinthSearchParams } from "./route";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const ALLOWED_MOD_LOADERS = ["forge", "fabric", "quilt", "neoforge"] as const;
const SHOW_LOADERS_ON = ["mod", "modpack", "shader"] as const;

function filterOn(name: string, list: LoaderTag[]): LoaderTag[] {
	if (name === "modpack" || name === "mod") {
		return list.filter((e) => ALLOWED_MOD_LOADERS.includes(e.name));
	}
	return list.filter((e) => e.supported_project_types.includes("shader"));
}

export const Route = createLazyFileRoute("/_authenticated/workshop/search")({
	component: WorkshopHome,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});

function WorkshopHome() {
	const search = Route.useSearch();
	const location = useLocation();
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
			if (!list.data) throw new Error("Failed to load categories");

			const headers = Object.groupBy(list.data, (e) => e.header);

			const output: Record<string, Record<string, CategoryTag[]>> = {};
			for (const [header, values] of Object.entries(headers)) {
				if (!values) continue;

				const groups: Record<string, CategoryTag[]> = {};
				for (const value of values) {
					if (!groups[value.project_type]) groups[value.project_type] = [];
					groups[value.project_type].push(value);
				}

				output[header] = groups;
			}

			return output;
		},
	});
	const modrinthLoaders = useSuspenseQuery({
		queryKey: ["MODRINTH", "TAGS", "LOADERS"],
		queryFn: async () => {
			const list = await loaderList({
				client: modrinthClient,
			});
			if (list.error) throw list.error;
			if (!list.data) throw new Error("Failed to load categories");
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
			if (!list.data) throw new Error("Failed to load categories");
			return list.data.filter((e) => !["plugin", "datapack"].includes(e));
		},
	});

	const results = useQuery({
		queryKey: [
			"MODRINTH",
			"SEARCH",
			search.query,
			search.index,
			search.limit,
			search.facets,
			search.offset,
		],
		queryFn: async () => {
			const results = await searchProjects({
				client: modrinthClient,
				query: {
					query: search.query,
					facets: JSON.stringify(search.facets.toArray()),
					offset: search.offset,
					limit: search.limit,
					index: search.index,
				},
			});
			if (results.error) throw results.error;
			if (!results.data) throw new Error("Failed to load");
			return results.data;
		},
	});

	useEffect(() => {
		if (location.pathname === "/_authenticated/workshop/search") {
			navigate({
				search: (prev) => ({ ...prev, query: queryValue }),
			});
		}
	}, [queryValue, navigate, location.pathname]);

	return (
		<div className="flex h-full overflow-hidden bg-accent/35">
			<aside className="w-60 overflow-y-scroll h-full pl-4 space-y-4">
				<div className="space-y-2">
					<TypographyH3>Project Type</TypographyH3>
					<RadioGroup
						onValueChange={(e) => {
							setQuery("");
							navigate({
								search: (prev) => ({
									...prev,
									facets: prev?.facets?.setProjectType(e),
									offset: 0,
									query: "",
								}),
							});
						}}
						defaultValue={search.facets.getDisplayProjectType()}
					>
						{modrinthProjectTypes.data?.map((item) => (
							<div key={item} className="flex items-center space-x-2">
								<RadioGroupItem value={item} id={`${item}_radio_opt`} />
								<Label htmlFor={`${item}_radio_opt`}>
									{item.replace(/^\w/, item[0].toUpperCase())}
								</Label>
							</div>
						))}
					</RadioGroup>
				</div>

				{Object.entries(categoires.data).map(([key, values]) => {
					return Object.entries(values)
						.filter((e) => e[0] === search.facets.getProjectType())
						.map(([_, item]) => (
							<div className="space-y-2" key={key}>
								<TypographyH3>
									{key.replace(/^\w/, key[0].toUpperCase())}
								</TypographyH3>
								<ul className="space-y-2">
									{item.map((item) => (
										<Selectable
											key={item.name}
											name={item.name}
											checked={search.facets.hasCategory(item.name)}
											onChange={() =>
												navigate({
													search: (prev) => ({
														...prev,
														facets: prev?.facets?.toggleCategory(item.name),
													}),
												})
											}
										/>
									))}
								</ul>
							</div>
						));
				})}

				{search.facets.isAnyProject(SHOW_LOADERS_ON) ? (
					<div className="space-y-2">
						<TypographyH3>Loaders</TypographyH3>
						<ul className="space-y-2">
							{filterOn(
								search.facets.getProjectType(),
								modrinthLoaders.data,
							)?.map((item) => (
								<Selectable
									key={item.name}
									name={item.name}
									checked={search.facets.hasLoader(item.name)}
									onChange={() =>
										navigate({
											search: (prev) => ({
												...prev,
												facets: prev?.facets?.toggleLoader(item.name),
											}),
										})
									}
								/>
							))}
						</ul>
					</div>
				) : null}

				{search.facets.isAnyProject(["mod", "modpack"]) ? (
					<div className="space-y-2">
						<TypographyH4>Environments</TypographyH4>
						<ul className="space-y-2">
							<li className="flex items-center space-x-2">
								<Checkbox
									onClick={() =>
										navigate({
											search: (prev) => ({
												...prev,
												facets: prev?.facets?.toggleEnv("client"),
											}),
										})
									}
								/>
								<Label className="inline-flex items-center gap-1">
									<span className="inline-block h-4 w-4">
										<svg
											data-v-33894821=""
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<rect width="20" height="14" x="2" y="3" rx="2" ry="2" />
											<path d="M8 21h8m-4-4v4" />
										</svg>
									</span>
									Client
								</Label>
							</li>
							<li className="flex items-center space-x-2">
								<Checkbox
									onCheckedChange={() =>
										navigate({
											search: (prev) => ({
												...prev,
												facets: prev?.facets?.toggleEnv("server"),
											}),
										})
									}
								/>
								<Label className="inline-flex items-center gap-1">
									<span className="inline-block h-4 w-4">
										<svg
											data-v-33894821=""
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											stroke="currentColor"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											viewBox="0 0 24 24"
											aria-hidden="true"
										>
											<path d="M22 12H2M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11M6 16h.01M10 16h.01" />
										</svg>
									</span>
									Server
								</Label>
							</li>
						</ul>
					</div>
				) : null}
			</aside>
			<div className="w-full h-full overflow-y-scroll flex flex-col">
				<header className="flex px-4 pt-4">
					<search className="flex w-full gap-4 items-center">
						<Input
							value={query}
							onChange={(ev) => setQuery(ev.target.value)}
							placeholder="Search..."
						/>

						<Label className="text-nowrap">Sort By</Label>
						<Select
							onValueChange={(e) =>
								navigate({
									search: (prev) => ({
										...prev,
										index: e as ModrinthSearchParams["index"],
										offset: 0,
									}),
								})
							}
							defaultValue={search.index}
						>
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
						<Select
							onValueChange={(e) =>
								navigate({
									search: (prev) => ({
										...prev,
										limit: Number.parseInt(e),
										offset: 0,
									}),
								})
							}
							defaultValue={search.limit.toString()}
						>
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
				<WorkshopPagination
					hits={results.data?.hits.length ?? 0}
					offset={results.data?.offset ?? 0}
					total_hits={results.data?.total_hits ?? 0}
					limit={results.data?.limit ?? 0}
				/>
				<div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-3 xl:grid-cols-3  flex-grow">
					{results.isLoading ? (
						<>
							{Array.from({ length: search.limit }).map((_, i) => (
								<Card key={`skeletion_${i + 1}`}>
									<CardHeader className="flex-row gap-4 space-y-0 pb-2">
										<Skeleton className="h-12 w-12 rounded-full" />
										<div>
											<Skeleton className="h-5 w-32 mt-1 mb-2" />
											<span className="text-sm text-muted-foreground">
												<Skeleton className="h-4 w-24" />
											</span>
										</div>
									</CardHeader>
									<CardContent className="flex flex-grow flex-col">
										<div className="col-span-3 flex flex-col gap-2 justify-between h-full">
											<Skeleton className="w-full h-16" />
											<div className="space-y-1">
												<div className="flex flex-wrap gap-1">
													<Skeleton className="h-5 w-10" />
													<Skeleton className="h-5 w-10" />
													<Skeleton className="h-5 w-10" />
												</div>
												<div className="flex items-center gap-2 flex-wrap" />
											</div>
										</div>
									</CardContent>
								</Card>
							))}
						</>
					) : results.isError ? (
						<div className="col-span-full row-span-full flex flex-col items-center justify-center">
							<TriangleAlert className="h-20 w-20" />
							<TypographyH3>Failed to load search results!</TypographyH3>
							<pre className="text-sm">
								<code>{results.error.message}</code>
							</pre>
						</div>
					) : !results.data?.hits.length ? (
						<div className="col-span-full row-span-full flex flex-col items-center justify-center">
							<Sparkles className="h-20 w-20" />
							<TypographyH3>No results found!</TypographyH3>
						</div>
					) : (
						results.data?.hits.map((project) => (
							<Link
								search={{} as ModrinthSearchParams}
								key={project.project_id}
								to="/workshop/project/$id"
								params={{ id: project.project_id }}
							>
								<Card className="h-full flex flex-col">
									<CardHeader className="flex-row gap-4 space-y-0 pb-2">
										<Avatar className="h-12 w-12">
											<AvatarFallback>
												<FileImage />
											</AvatarFallback>
											<AvatarImage src={project.icon_url ?? undefined} />
										</Avatar>
										<div title={project.title}>
											<TypographyH4 className="line-clamp-1">
												{project.title ?? "Unknown Project"}
											</TypographyH4>
											<span className="text-sm text-muted-foreground">
												By <span className="underline">{project.author}</span>
											</span>
										</div>
									</CardHeader>
									<CardContent className="flex flex-grow flex-col">
										<div className="col-span-3 flex flex-col gap-2 justify-between h-full">
											<p className="line-clamp-5 text-sm xl:text-base xl:py-2">
												{project.description}
											</p>
											<div className="space-y-1">
												<div className="flex flex-wrap gap-1">
													{project.display_categories?.map((cat) => (
														<Badge key={`${project.project_id}_${cat}`}>
															{cat}
														</Badge>
													))}
												</div>
												<div className="flex items-center gap-2 flex-wrap">
													<div className="flex items-center" title="Downloads">
														<Download className="mr-1 h-5 w-5" />
														<span className="text-sm xl:text-lg font-bold">
															{project.downloads.toLocaleString(undefined, {
																notation: "compact",
																maximumFractionDigits: 2,
															})}
														</span>
													</div>
													<div className="flex items-center" title="Follows">
														<Heart className="mr-1 h-5 w-5" />
														<span className="text-sm xl:text-lg font-bold">
															{project.follows.toLocaleString()}
														</span>
													</div>
													<div
														className="mt-auto flex items-center"
														title="Updated"
													>
														<Activity className="mr-1 h-5 w-5" />
														<span className="font-bold">
															{formatRelative(
																project.date_modified,
																new Date(),
															)}
														</span>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							</Link>
						))
					)}
				</div>
				<WorkshopPagination
					hits={results.data?.hits.length ?? 0}
					offset={results.data?.offset ?? 0}
					total_hits={results.data?.total_hits ?? 0}
					limit={results.data?.limit ?? 0}
				/>
			</div>
		</div>
	);
}
