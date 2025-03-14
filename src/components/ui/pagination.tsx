import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { forwardRef } from "react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Pagination = ({
	className,
	...props
}: React.ComponentProps<"nav">) => (
	<nav
		aria-label="pagination"
		className={cn("mx-auto flex w-full justify-center", className)}
		{...props}
	/>
);
Pagination.displayName = "Pagination";

export const PaginationContent = forwardRef<
	HTMLUListElement,
	React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
	<ul
		ref={ref}
		className={cn("flex flex-row items-center gap-1", className)}
		{...props}
	/>
));
PaginationContent.displayName = "PaginationContent";

export const PaginationItem = forwardRef<
	HTMLLIElement,
	React.ComponentProps<"li">
>(({ className, ...props }, ref) => (
	<li ref={ref} className={cn("", className)} {...props} />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
	isActive?: boolean;
} & ButtonProps;

export const PaginationLink = ({
	isActive,
	size = "icon",
	...props
}: PaginationLinkProps) => (
	<Button
		aria-current={isActive ? "page" : undefined}
		size={size}
		variant={isActive ? "outline" : "ghost"}
		{...props}
	/>
);
PaginationLink.displayName = "PaginationLink";

export const PaginationPrevious = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to previous page"
		size="default"
		className={cn("gap-1 pl-2.5", className)}
		{...props}
	>
		<ChevronLeft className="h-4 w-4" />
		<span>Previous</span>
	</PaginationLink>
);
PaginationPrevious.displayName = "PaginationPrevious";

export const PaginationNext = ({
	className,
	...props
}: React.ComponentProps<typeof PaginationLink>) => (
	<PaginationLink
		aria-label="Go to next page"
		size="default"
		className={cn("gap-1 pr-2.5", className)}
		{...props}
	>
		<span>Next</span>
		<ChevronRight className="h-4 w-4" />
	</PaginationLink>
);
PaginationNext.displayName = "PaginationNext";

export const PaginationEllipsis = ({
	className,
	...props
}: React.ComponentProps<"span">) => (
	<span
		aria-hidden
		className={cn("flex h-9 w-9 items-center justify-center", className)}
		{...props}
	>
		<MoreHorizontal className="h-4 w-4" />
		<span className="sr-only">More pages</span>
	</span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";
