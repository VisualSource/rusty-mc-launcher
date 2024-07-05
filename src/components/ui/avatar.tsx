import { Root, Image, Fallback } from "@radix-ui/react-avatar";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const Avatar = forwardRef<
	React.ElementRef<typeof Root>,
	React.ComponentPropsWithoutRef<typeof Root>
>(({ className, ...props }, ref) => (
	<Root
		ref={ref}
		className={cn(
			"relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
			className,
		)}
		{...props}
	/>
));
Avatar.displayName = Root.displayName;

export const AvatarImage = forwardRef<
	React.ElementRef<typeof Image>,
	React.ComponentPropsWithoutRef<typeof Image>
>(({ className, ...props }, ref) => (
	<Image
		ref={ref}
		className={cn("aspect-square h-full w-full", className)}
		{...props}
	/>
));
AvatarImage.displayName = Image.displayName;

export const AvatarFallback = forwardRef<
	React.ElementRef<typeof Fallback>,
	React.ComponentPropsWithoutRef<typeof Fallback>
>(({ className, ...props }, ref) => (
	<Fallback
		ref={ref}
		className={cn(
			"flex h-full w-full items-center justify-center rounded-full bg-muted",
			className,
		)}
		{...props}
	/>
));
AvatarFallback.displayName = Fallback.displayName;
