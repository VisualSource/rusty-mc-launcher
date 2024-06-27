import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { range } from "@/lib/range";
import { useId } from "react";

const getOffset = (offset: number, max: number): number => {
	if (offset < 0) return 0;
	if (offset > max) return max;
	return offset;
};

const getPage = (total: number, limit: number, offset: number): number => {
	return offset >= total ? 1 : Math.ceil(offset / limit) + 1;
};

const PaginationDyanmicMiddle: React.FC<{
	total_hits: number;
	limit: number;
	offset: number;
	hits: number;
	componentId: string;
	maxPages: number;
	currentPage: number;
}> = ({
	total_hits,
	limit,
	hits,
	offset,
	componentId,
	maxPages,
	currentPage,
}) => {
	if (total_hits === 0 && offset === 0 && limit === 0)
		return <span className="px-2">Loading...</span>;
	if (hits === 0) return null;
	if (maxPages < 5)
		return (
			<>
				{Array(maxPages - 1)
					.fill(0)
					.map((_, i_offset) => {
						const page_offset = (i_offset + 1) * limit;
						const page = getPage(total_hits, limit, page_offset);
						return (
							<PaginationItem
								key={`${componentId}-page_${page}-offset_${page_offset}`}
							>
								<PaginationLink
									isActive={currentPage === page}
									search={(prev) => ({
										...prev,
										offset: getOffset(page_offset, total_hits),
									})}
								>
									{page}
								</PaginationLink>
							</PaginationItem>
						);
					})}
			</>
		);
	if (currentPage <= 5)
		return (
			<>
				{range(1, 5).map((i_offset) => {
					const page_offset = i_offset * limit;
					const page = getPage(total_hits, limit, page_offset);
					return (
						<PaginationItem
							key={`${componentId}-page_${page}-offset_${page_offset}`}
						>
							<PaginationLink
								isActive={currentPage === page}
								search={(prev) => ({
									...prev,
									offset: getOffset(page_offset, total_hits),
								})}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					);
				})}
				{maxPages > 5 ? (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				) : null}
			</>
		);
	if (currentPage >= maxPages - 4)
		return (
			<>
				<PaginationItem>
					<PaginationEllipsis />
				</PaginationItem>
				{range(-5, -2).map((page_offset) => {
					const i = total_hits + limit * page_offset;
					const page = getPage(total_hits, limit, i);
					return (
						<PaginationItem key={`offset_${i}`}>
							<PaginationLink
								isActive={currentPage === page}
								search={(prev) => ({
									...prev,
									offset: getOffset(i, total_hits),
								})}
							>
								{page}
							</PaginationLink>
						</PaginationItem>
					);
				})}
			</>
		);

	return (
		<>
			<PaginationItem>
				<PaginationEllipsis />
			</PaginationItem>
			{range(-1, 1).map((i_offset) => {
				const page_offset = offset + limit * i_offset;
				const page = getPage(total_hits, limit, page_offset);
				return (
					<PaginationItem
						key={`${componentId}-page_${page}-offset_${page_offset}`}
					>
						<PaginationLink
							isActive={currentPage === page}
							search={(prev) => ({
								...prev,
								offset: getOffset(page_offset, total_hits),
							})}
						>
							{page}
						</PaginationLink>
					</PaginationItem>
				);
			})}
			<PaginationItem>
				<PaginationEllipsis />
			</PaginationItem>
		</>
	);
};

export function WorkshopPagination({
	total_hits,
	limit,
	offset,
	hits,
}: { hits: number; total_hits: number; limit: number; offset: number }) {
	const componentId = useId();
	const maxPages = getPage(total_hits, limit, total_hits - limit);
	const currentPage = getPage(total_hits, limit, offset);
	return (
		<Pagination className="py-2">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						disabled={currentPage === 1}
						search={(prev) => ({
							...prev,
							offset: getOffset(offset - limit, total_hits),
						})}
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink
						isActive={currentPage === 1}
						search={(prev) => ({ ...prev, offset: 0 })}
					>
						1
					</PaginationLink>
				</PaginationItem>
				<PaginationDyanmicMiddle
					componentId={componentId}
					total_hits={total_hits}
					hits={hits}
					offset={offset}
					maxPages={maxPages}
					currentPage={currentPage}
					limit={limit}
				/>
				{maxPages > 5 ? (
					<PaginationItem>
						<PaginationLink
							isActive={currentPage === maxPages}
							search={(prev) => ({ ...prev, offset: total_hits })}
						>
							{maxPages}
						</PaginationLink>
					</PaginationItem>
				) : null}
				<PaginationItem>
					<PaginationNext
						disabled={currentPage === maxPages}
						search={(prev) => ({
							...prev,
							offset: getOffset(offset + limit, total_hits),
						})}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
