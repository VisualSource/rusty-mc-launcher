import { Root, Trigger, Group, Portal, Sub, Content, RadioItem, ItemIndicator, Separator, Label, CheckboxItem, Item, RadioGroup, SubTrigger, SubContent } from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Root;

export const DropdownMenuTrigger = Trigger;

export const DropdownMenuGroup = Group;

export const DropdownMenuPortal = Portal;

export const DropdownMenuSub = Sub;

export const DropdownMenuRadioGroup = RadioGroup;

export const DropdownMenuSubTrigger = forwardRef<
	React.ElementRef<typeof SubTrigger>,
	React.ComponentPropsWithoutRef<typeof SubTrigger> & {
		inset?: boolean;
	}
>(({ className, inset, children, ...props }, ref) => (
	<SubTrigger
		ref={ref}
		className={cn(
			"flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-accent data-[state=open]:bg-accent",
			inset && "pl-8",
			className,
		)}
		{...props}
	>
		{children}
		<ChevronRight className="ml-auto h-4 w-4" />
	</SubTrigger>
));
DropdownMenuSubTrigger.displayName = SubTrigger.displayName;

export const DropdownMenuSubContent = forwardRef<
	React.ElementRef<typeof SubContent>,
	React.ComponentPropsWithoutRef<typeof SubContent>
>(({ className, ...props }, ref) => (
	<SubContent
		ref={ref}
		className={cn(
			"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
			className,
		)}
		{...props}
	/>
));
DropdownMenuSubContent.displayName = SubContent.displayName;

export const DropdownMenuContent = forwardRef<
	React.ElementRef<typeof Content>,
	React.ComponentPropsWithoutRef<typeof Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
	<Portal>
		<Content
			ref={ref}
			sideOffset={sideOffset}
			className={cn(
				"z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
				className,
			)}
			{...props}
		/>
	</Portal>
));
DropdownMenuContent.displayName = Content.displayName;

export const DropdownMenuItem = forwardRef<
	React.ElementRef<typeof Item>,
	React.ComponentPropsWithoutRef<typeof Item> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<Item
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
DropdownMenuItem.displayName = Item.displayName;

export const DropdownMenuCheckboxItem = forwardRef<
	React.ElementRef<typeof CheckboxItem>,
	React.ComponentPropsWithoutRef<typeof CheckboxItem>
>(({ className, children, checked, ...props }, ref) => (
	<CheckboxItem
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		)}
		checked={checked}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<ItemIndicator>
				<Check className="h-4 w-4" />
			</ItemIndicator>
		</span>
		{children}
	</CheckboxItem>
));
DropdownMenuCheckboxItem.displayName = CheckboxItem.displayName;

export const DropdownMenuRadioItem = forwardRef<
	React.ElementRef<typeof RadioItem>,
	React.ComponentPropsWithoutRef<typeof RadioItem>
>(({ className, children, ...props }, ref) => (
	<RadioItem
		ref={ref}
		className={cn(
			"relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none transition-colors focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
			className,
		)}
		{...props}
	>
		<span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
			<ItemIndicator>
				<Circle className="h-2 w-2 fill-current" />
			</ItemIndicator>
		</span>
		{children}
	</RadioItem>
));
DropdownMenuRadioItem.displayName = RadioItem.displayName;

export const DropdownMenuLabel = forwardRef<
	React.ElementRef<typeof Label>,
	React.ComponentPropsWithoutRef<typeof Label> & {
		inset?: boolean;
	}
>(({ className, inset, ...props }, ref) => (
	<Label
		ref={ref}
		className={cn(
			"px-2 py-1.5 text-sm font-semibold",
			inset && "pl-8",
			className,
		)}
		{...props}
	/>
));
DropdownMenuLabel.displayName = Label.displayName;

export const DropdownMenuSeparator = forwardRef<
	React.ElementRef<typeof Separator>,
	React.ComponentPropsWithoutRef<typeof Separator>
>(({ className, ...props }, ref) => (
	<Separator
		ref={ref}
		className={cn("-mx-1 my-1 h-px bg-muted", className)}
		{...props}
	/>
));
DropdownMenuSeparator.displayName = Separator.displayName;

export const DropdownMenuShortcut = ({
	className,
	...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
	return (
		<span
			className={cn("ml-auto text-xs tracking-widest opacity-60", className)}
			{...props}
		/>
	);
};
DropdownMenuShortcut.displayName = "DropdownMenuShortcut";