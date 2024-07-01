import {
	createLazyFileRoute,
	Link,
	ErrorComponent,
} from "@tanstack/react-router";
import {
	Activity,
	Download,
	FileImage,
	Heart,
	Sparkles,
	TriangleAlert,
} from "lucide-react";
import { formatRelative } from "date-fns/formatRelative";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useCallback } from "react";


import {
	searchProjects,
} from "@lib/api/modrinth/services.gen";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { WorkshopPagination, getPaginationItems, getPage, getOffset } from "@/components/workshop/WorkshopPagination";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { TypographyH3, TypographyH4 } from "@/components/ui/typography";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

import { modrinthClient } from "@/lib/api/modrinthClient";

import { Skeleton } from "@/components/ui/skeleton";
import type { ModrinthSearchParams } from "./route";
import { Loading } from "@/components/Loading";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import debounce from "lodash.debounce";
import { SearchFilters } from "@/components/workshop/SearchFilters";

export const Route = createLazyFileRoute("/_authenticated/workshop/search")({
	component: WorkshopHome,
	errorComponent: (error) => <ErrorComponent error={error} />,
	pendingComponent: Loading,
});

function WorkshopHome() {
	const search = Route.useSearch();
	const navigate = Route.useNavigate();
	const queryHandler = useCallback(debounce((ev: React.FormEvent<HTMLFormElement> | React.ChangeEvent<HTMLInputElement>) => {
		let query = "";
		if (ev.type === "submit") {
			const data = new FormData(ev.target as HTMLFormElement);
			query = data.get("query")?.toString() ?? "";

		} else {
			query = (ev.target as HTMLInputElement).value;
		}

		navigate({
			search: (prev) => ({
				...prev,
				query,
				offset: 0
			})
		})
	}, 500), []);

	const { isError, isLoading, data, error } = useQuery({
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
			const { error, data, response } = await searchProjects({
				client: modrinthClient,
				query: {
					query: search.query,
					facets: JSON.stringify(search.facets.toArray()),
					offset: search.offset,
					limit: search.limit,
					index: search.index,
				},
			});
			if (error) throw error;
			if (!response.ok || !data) throw new Error("Failed to load search results", { cause: response });

			const maxPages = getPage(data.total_hits, data.limit, data.total_hits - data.limit);
			const currentPage = getPage(data.total_hits, data.limit, data.offset);
			const items = getPaginationItems(maxPages, data.limit, data.total_hits, currentPage, data.offset);
			const prev = getOffset(data.offset - data.limit, data.total_hits);
			const next = getOffset(data.offset + data.limit, data.total_hits);

			return {
				prev,
				next,
				currentPage,
				maxPages,
				hits: data.hits,
				totalHits: data.total_hits,
				links: items
			};
		},
	});

	return (
		<div className="flex h-full overflow-hidden bg-accent/35">
			<aside className="w-60 overflow-y-scroll h-full pl-4 space-y-4 scrollbar pb-4">
				<Suspense fallback={<Loading />}>
					<SearchFilters search={search} navigate={navigate} />
				</Suspense>
			</aside>
			<div className="w-full h-full overflow-y-scroll flex flex-col scrollbar">
				<header className="flex px-4 pt-4">
					<search className="flex w-full gap-4 items-center">
						<form className="w-full" onSubmit={(ev) => {
							ev.preventDefault();
							queryHandler(ev);
						}}>
							<Input name="query" id="search-box"
								defaultValue={search.query}
								placeholder="Search..."
								onChange={queryHandler}
							/>
						</form>

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
				<WorkshopPagination offsetNext={data?.next ?? 0} offsetPrev={data?.prev ?? 0} isLoading={isLoading} isError={isError} totalHits={data?.totalHits ?? 0} currentPage={data?.currentPage ?? 0} maxPages={data?.maxPages ?? 0} items={data?.links ?? []} />
				<div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-3 xl:grid-cols-3 flex-grow">
					{isLoading ? (
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
					) : isError ? (
						<div className="col-span-full row-span-full flex flex-col items-center justify-center">
							<TriangleAlert className="h-20 w-20" />
							<TypographyH3>Failed to load search results!</TypographyH3>
							<pre className="text-sm">
								<code>{error.message}</code>
							</pre>
						</div>
					) : !data?.hits.length ? (
						<div className="col-span-full row-span-full flex flex-col items-center justify-center">
							<Sparkles className="h-20 w-20" />
							<TypographyH3>No results found!</TypographyH3>
						</div>
					) : (
						data?.hits.map((project) => (
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
				<WorkshopPagination offsetNext={data?.next ?? 0} offsetPrev={data?.prev ?? 0} isLoading={isLoading} isError={isError} totalHits={data?.totalHits ?? 0} currentPage={data?.currentPage ?? 0} maxPages={data?.maxPages ?? 0} items={data?.links ?? []} />
			</div>
		</div>
	);
}
