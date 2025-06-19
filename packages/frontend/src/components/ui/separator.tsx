"use client";
import * as SeparatorPrimitive from "@radix-ui/react-separator";

import { cn } from "@/lib/utils";
import { memo } from "react";

function SeparatorCore({
	className,
	orientation = "horizontal",
	decorative = true,
	...props
}: React.ComponentProps<typeof SeparatorPrimitive.Root>) {
	return (
		<SeparatorPrimitive.Root
			data-slot="separator-root"
			decorative={decorative}
			orientation={orientation}
			className={cn(
				"bg-border shrink-0 data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px",
				className,
			)}
			{...props}
		/>
	);
}

const Separator = memo(SeparatorCore);
Separator.displayName = "Separator";
export { Separator };
