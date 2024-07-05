import { cva, type VariantProps } from "class-variance-authority";
import { Root } from "@radix-ui/react-label";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const labelVariants = cva(
	"text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
);

export const Label = forwardRef<
	React.ElementRef<typeof Root>,
	React.ComponentPropsWithoutRef<typeof Root> &
	VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<Root
		ref={ref}
		className={cn(labelVariants(), className)}
		{...props}
	/>
));
Label.displayName = Root.displayName;

