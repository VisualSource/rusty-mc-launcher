import type { NotificationCenterItem } from "react-toastify/addons/use-notification-center";
import { formatRelative } from "date-fns/formatRelative";
import type { Id } from "react-toastify";
import { X } from "lucide-react";

import type { ToastData } from "../ui/toast";
import { Button } from "../ui/button";

const Description: React.FC<{ value: Partial<ToastData> }> = ({ value }) => {
	if (
		value?.error &&
		(typeof value.error === "string" || value.error instanceof Error)
	)
		return (
			<pre className="text-xs text-red-600 break-words text-wrap max-w-64">
				<code>{(value.error as Error)?.message ?? value.error}</code>
			</pre>
		);

	if (value.description)
		return <p className="text-sm opacity-90">{value.description}</p>;

	return null;
};

export const Notification: React.FC<{
	item: NotificationCenterItem<Partial<ToastData>>;
	remove: (id: Id) => void;
}> = ({ item, remove }) => {
	return (
		<li className="flex items-center justify-between rounded-lg px-4 py-1 border relative overflow-hidden">
			{item.read ? null : (
				<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2" />
			)}
			<div className="flex flex-col">
				<div className="flex flex-col">
					<div className="flex flex-col overflow-hidden">
						<h1 className="line-clamp-1 font-medium">
							{item.data?.title ?? "Unknown Event"}
						</h1>
						{item.data ? (
							<div className="flex">
								<Description value={item.data} />
							</div>
						) : null}
					</div>
				</div>
				<div className="flex justify-between items-center">
					<span className="text-muted-foreground text-xs">
						{formatRelative(new Date(item.createdAt), new Date())}
					</span>
				</div>
			</div>
			<div>
				<Button
					title="Delete notification"
					onClick={() => remove(item.id)}
					size="icon"
					variant="ghost"
				>
					<X className="h-4 w-4" />
				</Button>
			</div>
		</li>
	);
};
