import type { ToastContentProps } from "react-toastify";
import { cva } from "class-variance-authority";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastData = {
	title: string;
	description?: string;
	error?: string | Error;
	showCloseBtn?: boolean
}

const toastVariants = cva(
	"group pointer-events-auto flex w-full items-center justify-between overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
	{
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				error:
					"destructive group border-destructive bg-destructive text-destructive-foreground",
				info: "",
				success: "",
				warning: ""
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export const Toast: React.FC<ToastContentProps<ToastData>> = ({
	toastProps,
	data: { showCloseBtn = true, ...data },
	closeToast
}) => {
	const className = typeof toastProps.className === "function" ? toastProps.className() : toastProps.className;
	return (
		<div role="alert" className={cn(toastVariants({ variant: toastProps.type }), className)}>
			<div className="text-sm font-semibold [&+div]:text-xs">{data.title}</div>
			<div className="text-sm opacity-90">{data.description}</div>
			{showCloseBtn ? <ToastClose onClick={closeToast} /> : null}
		</div>
	);
}

const ToastClose: React.FC<React.ComponentProps<"button">> = ({
	className,
	...props
}) => {
	return (
		<button
			type="button"
			className={cn(
				"absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-hidden focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 hover:group-[.destructive]:text-red-50 focus:group-[.destructive]:ring-red-400 focus:group-[.destructive]:ring-offset-red-600",
				className,
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</button>
	);
};