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
import { useCallback, useId } from "react";
import { Skeleton } from "../ui/skeleton";
import searchManager from "@lib/system/searchManager";

type PaginationLinkItem = { key: string; offset: number; page: number };

export const getOffset = (offset: number, max: number): number => {
	if (offset < 0) return 0;
	if (offset > max) return max;
	return offset;
};

export const getPage = (
	total: number,
	limit: number,
	offset: number,
): number => {
	return offset >= total ? 1 : Math.ceil(offset / limit) + 1;
};

export const getPaginationItems = (
	maxPages: number,
	limit: number,
	total_hits: number,
	currentPage: number,
	offset: number,
): PaginationLinkItem[] => {
	if (maxPages < 5) {
		return Array(maxPages - 1)
			.fill(0)
			.map((_, i_offset) => {
				const page_offset = (i_offset + 1) * limit;
				const page = getPage(total_hits, limit, page_offset);
				return {
					page,
					key: `page_${page}-offset_${page_offset}`,
					offset: getOffset(page_offset, total_hits),
				};
			});
	}
	if (currentPage <= 5) {
		return range(1, 5).map((i_offset) => {
			const page_offset = i_offset * limit;
			const page = getPage(total_hits, limit, page_offset);
			return {
				page,
				key: `page_${page}-offset_${page_offset}`,
				offset: getOffset(page_offset, total_hits),
			};
		});
	}
	if (currentPage >= maxPages - 4) {
		return range(-5, -2).map((page_offset) => {
			const i = total_hits + limit * page_offset;
			const page = getPage(total_hits, limit, i);
			return {
				page,
				key: `offset_${i}`,
				offset: getOffset(i, total_hits),
			};
		});
	}
	return range(-1, 1).map((i_offset) => {
		const page_offset = offset + limit * i_offset;
		const page = getPage(total_hits, limit, page_offset);
		return {
			page,
			key: `page_${page}-offset_${page_offset}`,
			offset: getOffset(page_offset, total_hits),
		};
	});
};

export function WorkshopPagination({
	isLoading,
	isError,
	maxPages,
	currentPage,
	items,
	offsetPrev,
	offsetNext,
	totalHits,
}: {
	currentPage: number;
	maxPages: number;
	items: PaginationLinkItem[];
	totalHits: number;
	offsetPrev: number;
	offsetNext: number;
	isLoading: boolean;
	isError: boolean;
}) {
	const goTo = useCallback((offset: number) => {
		searchManager.setOffset(offset).update();
	}, []);
	const componentId = useId();
	if (isError) return null;
	/*if (isLoading)
		return (
			<div className="py-2 px-4 flex justify-center">
				<Skeleton className="h-10 w-full" />
			</div>
		);*/

	return (
		<Pagination className="py-2 select-none">
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						disabled={currentPage === 1}
						onClick={() => goTo(offsetPrev)}
					/>
				</PaginationItem>
				<PaginationItem>
					<PaginationLink isActive={currentPage === 1} onClick={() => goTo(0)}>
						1
					</PaginationLink>
				</PaginationItem>
				{currentPage > 5 ? (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				) : null}
				{items.map((item) => (
					<PaginationItem key={`${componentId}_${item.key}`}>
						<PaginationLink
							isActive={currentPage === item.page}
							onClick={() => goTo(item.offset)}
						>
							{item.page}
						</PaginationLink>
					</PaginationItem>
				))}
				{currentPage < maxPages - 4 ? (
					<PaginationItem>
						<PaginationEllipsis />
					</PaginationItem>
				) : null}
				{maxPages > 5 ? (
					<PaginationItem>
						<PaginationLink
							isActive={currentPage === maxPages}
							onClick={() => goTo(totalHits)}
						>
							{maxPages}
						</PaginationLink>
					</PaginationItem>
				) : null}
				<PaginationItem>
					<PaginationNext
						disabled={currentPage === maxPages}
						onClick={() => goTo(offsetNext)}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
