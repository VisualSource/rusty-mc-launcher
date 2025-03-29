import type { ToastContentProps } from "react-toastify";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastData = {
	title: string;
	description?: string;
	error?: string | Error;
	showCloseBtn?: boolean;
};

export const Toast: React.FC<ToastContentProps<ToastData>> = ({
	data: { showCloseBtn = true, ...data },
	closeToast,
}) => {
	return (
		<div className="flex flex-col w-full">
			<div className="text-sm font-semibold [&+div]:text-xs">{data.title}</div>
			<div className="text-sm opacity-90">{data.description}</div>
			{showCloseBtn ? <ToastClose onClick={closeToast} /> : null}
		</div>
	);
};

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
