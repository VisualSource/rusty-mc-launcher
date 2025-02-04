import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";

export function TypographyH1({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<h1
			className={cn(
				"scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl",
				className,
			)}
		>
			{children}
		</h1>
	);
}

export function TypographyH2({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<h2
			className={cn(
				"scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
				className,
			)}
		>
			{children}
		</h2>
	);
}

export function TypographyH3({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<h3
			className={cn(
				"scroll-m-20 text-2xl font-semibold tracking-tight",
				className,
			)}
		>
			{children}
		</h3>
	);
}

export function TypographyH4({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<h4
			className={cn(
				"scroll-m-20 text-xl font-semibold tracking-tight",
				className,
			)}
		>
			{children}
		</h4>
	);
}

export function TypographyP({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<p className={cn("leading-7 not-first:mt-6", className)}>{children}</p>
	);
}

export function TypographyBlockquote({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<blockquote className={cn("mt-6 border-l-2 pl-6 italic", className)}>
			{children}
		</blockquote>
	);
}

export function TypographyInlineCode({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<code
			className={cn(
				"bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold",
				className,
			)}
		>
			{children}
		</code>
	);
}

export function TypographyLead({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<p className={cn("text-muted-foreground text-xl", className)}>{children}</p>
	);
}

export function TypographyLarge({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<div className={cn("text-lg font-semibold", className)}>{children}</div>
	);
}

export function TypographySmall({
	children,
	className,
}: React.PropsWithChildren<{ className?: string }>) {
	return (
		<small className={cn("text-sm font-medium leading-none", className)}>
			{children}
		</small>
	);
}

export function TypographyMuted({
	asChild = false,
	children,
	className,
}: React.PropsWithChildren<{ asChild?: boolean; className?: string }>) {
	const Comp = asChild ? Slot : "div";
	return (
		<Comp className={cn("text-sm text-zinc-500", className)}>{children}</Comp>
	);
}
