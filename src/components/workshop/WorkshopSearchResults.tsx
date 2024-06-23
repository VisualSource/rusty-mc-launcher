import { Link, useAsyncValue, useSearchParams } from "react-router-dom";
import { Download, Heart, RefreshCcw } from "lucide-react";
import { formatRelative } from "date-fns/formatRelative";

import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@component/ui/pagination";
import { Card, CardContent, CardHeader } from "@component/ui/card";
import type { SearchResults } from "@lib/api/modrinth/types.gen";
import { TypographyH3 } from "@component/ui/typography";
import { Badge } from "@component/ui/badge";
import { range } from "@lib/range";

const page = (total: number, limit: number, offset: number) => {
	return offset >= total ? 1 : Math.ceil(offset / limit) + 1;
};

const getQuery = (params: URLSearchParams, offset: number, max: number) => {
	if (offset < 0) offset = 0;
	if (offset > max) offset = max;
	params.set("offset", offset.toString());
	return params.toString();
};

const WorkshopSearchResults: React.FC = () => {
	const [params] = useSearchParams();
	const data = useAsyncValue() as SearchResults;

	const maxPages = page(
		data.total_hits,
		data.limit,
		data.total_hits - data.limit,
	);
	const currentPage = page(data.total_hits, data.limit, data.offset);

	return (
		<>
			<div className="grid flex-1 grid-flow-row grid-cols-1 gap-4 px-4 sm:grid-cols-3 xl:grid-cols-3">
				{data.hits.map((project) => (
					<Link key={project.project_id} to={`/workshop/${project.project_id}`}>
						<Card className="h-full">
							<CardHeader className="flex-row gap-4 space-y-0 pb-2">
								<div className="h-24 w-24 bg-gray-100">
									<img className="h-full w-full" src={project.icon_url ?? ""} />
								</div>
								<div>
									<TypographyH3>{project.title}</TypographyH3>
									<span className="text-sm text-zinc-300">
										By <span className="underline">{project.author}</span>
									</span>
								</div>
							</CardHeader>
							<CardContent className="flex flex-grow flex-col">
								<div className="col-span-3 flex flex-col gap-2">
									<p className="line-clamp-5">{project.description}</p>

									<div className="flex flex-wrap">
										{project.display_categories?.map((value, i) => (
											<Badge key={i}>{value}</Badge>
										))}
									</div>

									<div className="flex items-center gap-2">
										<div className="flex items-center">
											<Download className="mr-1 h-5 w-5" />
											<span className="text-lg font-bold">
												{project.downloads.toLocaleString(undefined, {
													notation: "compact",
													maximumFractionDigits: 2,
												})}
											</span>
										</div>
										<div className="flex items-center">
											<Heart className="mr-1 h-5 w-5" />
											<span className="text-lg font-bold">
												{project.follows.toLocaleString()}
											</span>
										</div>
									</div>
									<div className="mt-auto flex items-center">
										<RefreshCcw className="mr-1 h-5 w-5" />
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
						<PaginationPrevious
							to={{
								search: getQuery(
									params,
									data.offset - data.limit,
									data.total_hits,
								),
							}}
						/>
					</PaginationItem>

					<PaginationItem>
						<PaginationLink
							isActive={currentPage === 1}
							to={{
								search: "offset=0",
							}}
						>
							1
						</PaginationLink>
					</PaginationItem>

					{currentPage <= 5 ? (
						<>
							{range(1, 5).map((offset) => {
								const itemPage = page(
									data.total_hits,
									data.limit,
									offset * data.limit,
								);
								return (
									<PaginationItem key={`offset_${offset * data.limit}`}>
										<PaginationLink
											isActive={currentPage === itemPage}
											to={{
												search: getQuery(
													params,
													offset * data.limit,
													data.total_hits,
												),
											}}
										>
											{itemPage}
										</PaginationLink>
									</PaginationItem>
								);
							})}
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
						</>
					) : currentPage >= maxPages - 4 ? (
						<>
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
							{range(-5, -2).map((offset) => {
								const i = data.total_hits + data.limit * offset;
								const itemsPage = page(data.total_hits, data.limit, i);
								return (
									<PaginationItem key={`offset_${i}`}>
										<PaginationLink
											isActive={currentPage === itemsPage}
											to={{
												search: getQuery(params, i, data.total_hits),
											}}
										>
											{itemsPage}
										</PaginationLink>
									</PaginationItem>
								);
							})}
						</>
					) : (
						<>
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
							{range(-1, 1).map((offset) => (
								<PaginationItem
									key={`offset_${data.offset + data.limit * offset}`}
								>
									<PaginationLink
										isActive={
											currentPage ===
											page(
												data.total_hits,
												data.limit,
												data.offset + data.limit * offset,
											)
										}
										to={{
											search: `offset=${data.offset + data.limit * offset}`,
										}}
									>
										{page(
											data.total_hits,
											data.limit,
											data.offset + data.limit * offset,
										)}
									</PaginationLink>
								</PaginationItem>
							))}
							<PaginationItem>
								<PaginationEllipsis />
							</PaginationItem>
						</>
					)}

					<PaginationItem>
						<PaginationLink
							isActive={currentPage === maxPages}
							to={{
								search: `offset=${data.total_hits}`,
							}}
						>
							{maxPages}
						</PaginationLink>
					</PaginationItem>

					<PaginationItem>
						<PaginationNext
							to={{
								search: getQuery(
									params,
									data.offset + data.limit,
									data.total_hits,
								),
							}}
						/>
					</PaginationItem>
				</PaginationContent>
			</Pagination>
		</>
	);
};

export default WorkshopSearchResults;
