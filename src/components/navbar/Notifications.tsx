import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { formatRelative } from "date-fns/formatRelative";
import { Archive, Mail } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { TypographyH4 } from "../ui/typography";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";
import { useModrinth } from "@/hooks/useModrinth";
import { useQuery } from "@tanstack/react-query";
import { getProjects, getVersions } from "@/lib/api/modrinth";
import { modrinthClient } from "@/lib/api/modrinthClient";
import { queryClient } from "@/lib/api/queryClient";
import { useModrinthNotifications } from "@/hooks/useModrinthNoitications";

const DisplayToastData = ({ value }: { value: unknown }) => {
	if (!value) return null;

	if (value instanceof Error) {
		return (
			<pre className="text-xs text-destructive text-wrap">
				<code>{value.message}</code>
			</pre>
		);
	}
	if (
		typeof value === "object" &&
		"error" in value &&
		value.error instanceof Error
	) {
		return (
			<pre className="text-xs text-destructive text-wrap">
				<code>{value.error.message}</code>
			</pre>
		);
	}

	if (typeof value === "string") {
		return (
			<pre className="text-xs text-muted-foreground text-wrap">{value}</pre>
		);
	}

	return null;
};

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
						"mr-2 flex items-center px-2.5 text-white transition-colors",
						{
							"bg-green-500": unreadCount > 0,
							"bg-zinc-800": unreadCount === 0,
						},
					)}
				>
					{unreadCount > 0 ? (
						<span className="mr-2 text-sm">{unreadCount}</span>
					) : null}
					<Mail className="h-5 w-5" />
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
							<li
								key={value.id}
								className="flex items-center justify-between rounded-lg px-4 py-1 border relative"
							>
								{value.read ? null : (
									<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2" />
								)}
								{(value.icon as React.ReactNode) ?? null}
								<div>
									<h1 className="line-clamp-1 font-medium">
										{value.content as React.ReactNode}
									</h1>

									<DisplayToastData value={value.data} />

									<span className="text-muted-foreground text-xs">
										{formatRelative(new Date(value.createdAt), new Date())}
									</span>
								</div>
								<Button
									title="Archive notification"
									onClick={() => system.remove(value.id)}
									size="icon"
									variant="ghost"
								>
									<Archive className="h-4 w-4" />
								</Button>
							</li>
						))}
						{modrinth.notifications.map((n) => (
							<li
								className="flex items-center justify-between rounded-lg px-4 py-1 border relative"
								key={n.id}
							>
								{n.read ? null : (
									<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2" />
								)}
								<div>
									<h1 className="line-clamp-2 font-medium">{n.title}</h1>
									<p className="text-xs text-muted-foreground text-wrap">
										{n.text}
									</p>
									<span className="text-muted-foreground text-xs">
										{formatRelative(new Date(n.created), new Date())}
									</span>
								</div>
								<Button
									title="Archive notification"
									onClick={() => modrinth.remove(n.id)}
									size="icon"
									variant="ghost"
								>
									<Archive className="h-4 w-4" />
								</Button>
							</li>
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
