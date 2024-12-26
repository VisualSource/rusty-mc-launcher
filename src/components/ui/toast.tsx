import {
	toast,
	type ToastOptions,
	type ToastContentProps,
	type Id,
	type UpdateOptions,
} from "react-toastify";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

const toastVariants = cva(
	"group pointer-events-auto flex w-full items-center justify-between overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all",
	{
		variants: {
			variant: {
				default: "border bg-background text-foreground",
				error:
					"destructive group border-destructive bg-destructive text-destructive-foreground",
				info: "border bg-background text-foreground",
				success: "border bg-background text-foreground",
				warning: "border bg-background text-foreground",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	},
);

export const ToastAction: React.FC<React.ComponentPropsWithRef<"button">> = ({
	className,
	ref,
	...props
}) => {
	return (
		<button
			type="button"
			ref={ref}
			className={cn(
				"inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive",
				className,
			)}
			{...props}
		/>
	);
};

const ToastClose: React.FC<React.ComponentPropsWithRef<"button">> = ({
	className,
	ref,
	...props
}) => {
	return (
		<button
			type="button"
			ref={ref}
			className={cn(
				"absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600",
				className,
			)}
			{...props}
		>
			<X className="h-4 w-4" />
		</button>
	);
};

const ToastTitle: React.FC<React.ComponentPropsWithRef<"div">> = ({
	className,
	ref,
	...props
}) => {
	return (
		<div
			ref={ref}
			className={cn("text-sm font-semibold", className)}
			{...props}
		/>
	);
};
const ToastDescription: React.FC<React.ComponentPropsWithRef<"div">> = ({
	className,
	ref,
	...props
}) => {
	return (
		<div ref={ref} className={cn("text-sm opacity-90", className)} {...props} />
	);
};

type ToastProps = VariantProps<typeof toastVariants> & {
	error?: unknown;
	title: string;
	description?: string;
	closeButton?: boolean;
};
const Toast: React.FC<ToastContentProps<ToastProps>> = ({
	data: { title, description, closeButton = true },
	closeToast,
	toastProps,
	isPaused,
	...props
}) => {
	return (
		<div className="w-full" {...props}>
			<ToastTitle>{title}</ToastTitle>
			<ToastDescription>{description}</ToastDescription>
			{closeButton ? <ToastClose onClick={closeToast} /> : null}
		</div>
	);
};

const createToast = ({
	variant,
	opts,
	...data
}: ToastProps & { opts?: Omit<ToastOptions, "type" | "closeButton"> }) =>
	toast(Toast as () => React.ReactNode, {
		...opts,
		className: toastVariants({ variant: variant }),
		type: variant ?? "default",
		closeButton: false,
		data,
	});

export default createToast;
export const updateToast = (
	id: Id,
	{ data, ...opts }: Omit<UpdateOptions<ToastProps>, "type" | "closeButton">,
) =>
	toast.update(id, {
		...opts,
		render: Toast as () => React.ReactNode,
		className: toastVariants({ variant: data?.variant }),
		type: data?.variant ?? "default",
		closeButton: false,
		data,
	});

export const waitToast = ({
	callback,
	pendingTitle,
	errorTitle,
	successTitle,
}: {
	successTitle: string;
	errorTitle: string;
	pendingTitle: string;
	callback: Promise<unknown>;
}) => {
	return toast.promise(callback, {
		pending: {
			render: Toast as () => React.ReactNode,
			className: toastVariants({ variant: "default" }),
			type: "default",
			data: {
				title: pendingTitle,
				closeButton: false,
			},
		},
		success: {
			render: Toast as () => React.ReactNode,
			className: toastVariants({ variant: "success" }),
			type: "success",
			data: {
				title: successTitle,
			} as never,
		},
		error: {
			render: Toast as () => React.ReactNode,
			className: toastVariants({ variant: "error" }),
			type: "error",
			data: {
				title: errorTitle,
			},
		},
	});
};
