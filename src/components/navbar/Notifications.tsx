import { type NotificationCenterItem, useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { Mail } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { useModrinthNotifications } from "@/hooks/useModrinthNoitications";
import { TypographyH4 } from "../ui/typography";
import { Notification } from "./Notification";
import type { ToastData } from "../ui/toast";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

export const Notifications = () => {
	const modrinth = useModrinthNotifications();
	const system = useNotificationCenter();

	const unreadCount = system.unreadCount + modrinth.unreadCount;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<button
					type="button"
					className={cn(
						"mr-2 flex items-center px-2.5 text-white transition-colors group",
						{
							"bg-green-500": unreadCount > 0,
							"bg-zinc-800": unreadCount === 0,
						},
					)}
				>
					{unreadCount > 0 ? (
						<span className="mr-2 text-sm">{unreadCount}</span>
					) : null}
					<Mail className="h-5 w-5 group-hover:scale-110 transition-transform duration-500" />
				</button>
			</PopoverTrigger>
			<PopoverContent align="end" sideOffset={4} className="w-80">
				<div className="flex justify-between">
					<TypographyH4>Notifications</TypographyH4>
				</div>
				<Separator className="mb-4 mt-2" />
				<div className="max-h-56 pt-4 overflow-y-auto scrollbar">
					<ul className="min-h-[200px] space-y-2">
						{system.notifications.map((value) => (
							<Notification item={value} key={value.id} remove={system.remove} />
						))}
						{modrinth.notifications.map((n) => (
							<Notification item={n as NotificationCenterItem<Partial<ToastData>>} key={n.id} remove={modrinth.remove} />
						))}
					</ul>
				</div>
				<Separator className="mb-4" />
				<div className="flex justify-between">
					<Button
						size="sm"
						onClick={() => {
							system.clear();
							modrinth.clear();
						}}
						variant="secondary"
					>
						Clear All
					</Button>
					<Button
						size="sm"
						onClick={() => {
							system.markAllAsRead();
							modrinth.markAllAsRead();
						}}
					>
						Mark All Read
					</Button>
				</div>
			</PopoverContent>
		</Popover>
	);
};
