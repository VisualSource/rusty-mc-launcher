import { Root, Indicator } from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export const Progress: React.FC<React.ComponentPropsWithRef<typeof Root>> = ({
	className,
	value,
	ref,
	...props
}) => (
	<Root
		ref={ref}
		className={cn(
			"relative h-4 w-full overflow-hidden rounded-full bg-secondary",
			className,
		)}
		{...props}
	>
		<Indicator
			className="h-full w-full flex-1 bg-primary transition-all"
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</Root>
);
Progress.displayName = Root.displayName;
