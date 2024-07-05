import { forwardRef } from "react";
import { Root, Group, Value, Trigger, Icon, ScrollDownButton, ItemText, ScrollUpButton, Content, Viewport, Portal, Label, Item, ItemIndicator, Separator } from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

export const Select = Root;

export const SelectGroup = Group;

export const SelectValue = Value;

export const SelectTrigger = forwardRef<
	React.ElementRef<typeof Trigger>,
	React.ComponentPropsWithoutRef<typeof Trigger>
>(({ className, children, ...props }, ref) => (
	<Trigger
		ref={ref}
		className={cn(
			"flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
			className,
		)}
		{...props}
	>
		{children}
		<Icon asChild>
			<ChevronDown className="h-4 w-4 opacity-50" />
		</Icon>
	</Trigger>
));
SelectTrigger.displayName = Trigger.displayName;

export const SelectScrollUpButton = forwardRef<
	React.ElementRef<typeof ScrollUpButton>,
	React.ComponentPropsWithoutRef<typeof ScrollUpButton>
>(({ className, ...props }, ref) => (
	<ScrollUpButton
		ref={ref}
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className,
		)}
		{...props}
	>
		<ChevronUp className="h-4 w-4" />
	</ScrollUpButton>
));
SelectScrollUpButton.displayName = ScrollUpButton.displayName;

export const SelectScrollDownButton = forwardRef<
	React.ElementRef<typeof ScrollDownButton>,
	React.ComponentPropsWithoutRef<typeof ScrollDownButton>
>(({ className, ...props }, ref) => (
	<ScrollDownButton
		ref={ref}
		className={cn(
			"flex cursor-default items-center justify-center py-1",
			className,
		)}
		{...props}
	>
		<ChevronDown className="h-4 w-4" />
	</ScrollDownButton>
));
SelectScrollDownButton.displayName = ScrollDownButton.displayName;

export const SelectContent = forwardRef<
	React.ElementRef<typeof Content>,
	React.ComponentPropsWithoutRef<typeof Content>
>(({ className, children, position = "popper", ...props }, ref) => (
	<Portal>
		<Content
			ref={ref}
			className={cn(
				"relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				position === "popper" &&
				"data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
				className,
			)}
			position={position}
			{...props}
		>
			<SelectScrollUpButton />
			<Viewport
				className={cn(
					"p-1",
					position === "popper" &&
					"h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
				)}
			>
				{children}
			</Viewport>
			<SelectScrollDownButton />
		</Content>
	</Portal>
));
SelectContent.displayName = Content.displayName;

export const SelectLabel = forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label>
>(({ className, ...props }, ref) => (
	<Label
		ref={ref}
		className={cn("py-1.5 pl-8 pr-2 text-sm font-semibold", className)}
		{...props}
	/>
));
SelectLabel.displayName = Label.displayName;

export const SelectItem = forwardRef<
	React.ElementRef<typeof Item>,
	React.ComponentPropsWithoutRef<typeof Item>
>(({ className, children, ...props }, ref) => (
	<Item
		ref={ref}
		className={cn(
			"relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<ItemIndicator>
				<Check className="h-4 w-4" />
			</ItemIndicator>
		</span>

		<ItemText>{children}</ItemText>
	</Item>
));
SelectItem.displayName = Item.displayName;

export const SelectSeparator = forwardRef<
	React.ElementRef<typeof Separator>,
	React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-muted", className)}
		{...props}
	/>
));
SelectSeparator.displayName = Separator.displayName;