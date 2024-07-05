import {
	Root,
	Item,
	Trigger,
	Header,
	Content,
} from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Accordion = Root;

export const AccordionItem = forwardRef<
	React.ElementRef<typeof Item>,
	React.ComponentPropsWithoutRef<typeof Item>
>(({ className, ...props }, ref) => (
	<Item ref={ref} className={cn("border-b", className)} {...props} />
));
AccordionItem.displayName = "AccordionItem";

export const AccordionTrigger = forwardRef<
	React.ElementRef<typeof Trigger>,
	React.ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
	<Header className="flex">
		<Trigger
			ref={ref}
			className={cn(
				"flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
				className,
			)}
			{...props}
		>
			{children}
			<ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
		</Trigger>
	</Header>
));
AccordionTrigger.displayName = Trigger.displayName;

export const AccordionContent = forwardRef<
	React.ElementRef<typeof Content>,
	React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, ...props }, ref) => (
	<Content
		ref={ref}
		className="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		{...props}
	>
		<div className={cn("pb-4 pt-0", className)}>{children}</div>
	</Content>
));

AccordionContent.displayName = Content.displayName;
