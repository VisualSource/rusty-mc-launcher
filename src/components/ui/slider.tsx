"use client";
import { useMemo } from "react";
import { Root, Track, Range, Thumb } from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

export const MarkedSlider = ({
	className,
	...props
}: React.ComponentProps<typeof Root>) => {
	return (
		<Root
			className={cn(
				"relative flex w-full touch-none select-none items-center",
				className,
			)}
			{...props}
		>
			<Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-secondary">
				<Range className="absolute h-full bg-primary" />
			</Track>
			<Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50">
				<div className="absolute left-1/2 top-7 h-4 w-fit -translate-x-1/2 text-center text-xs">
					{props.value?.[0] ?? 0}
				</div>
			</Thumb>
		</Root>
	);
};

export function Slider({
	className,
	defaultValue,
	value,
	min = 0,
	max = 100,
	...props
}: React.ComponentProps<typeof Root>) {
	const _values = useMemo(
		() =>
			Array.isArray(value)
				? value
				: Array.isArray(defaultValue)
					? defaultValue
					: [min, max],
		[value, defaultValue, min, max],
	);

	return (
		<Root
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			className={cn(
				"relative flex w-full touch-none items-center select-none data-[disabled]:opacity-50 data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
				className,
			)}
			{...props}
		>
			<Track
				data-slot="slider-track"
				className={cn(
					"bg-muted relative grow overflow-hidden rounded-full data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5",
				)}
			>
				<Range
					data-slot="slider-range"
					className={cn(
						"bg-primary absolute data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full",
					)}
				/>
			</Track>
			{Array.from({ length: _values.length }, (_, index) => (
				<Thumb
					data-slot="slider-thumb"
					// biome-ignore lint/suspicious/noArrayIndexKey: component from shadcn
					key={index}
					className="border-primary bg-background ring-ring/50 block size-4 shrink-0 rounded-full border shadow-sm transition-[color,box-shadow] hover:ring-4 focus-visible:ring-4 focus-visible:outline-hidden disabled:pointer-events-none disabled:opacity-50"
				/>
			))}
		</Root>
	);
}
