import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import { formatRelative } from "date-fns/formatRelative";
import { Archive, Mail } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { useModrinthNotifications } from "@/hooks/useModrinthNoitications";
import { TypographyH4 } from "../ui/typography";
import { Separator } from "../ui/separator";
import { Button } from "../ui/button";
import { cn } from "@/lib/utils";

const DisplayToastData = ({ value }: { value: unknown }) => {
	if (
		value instanceof Error ||
		(value &&
			typeof value === "object" &&
			"error" in value &&
			value.error instanceof Error)
	) {
		return (
			<span className="text-xs text-red-600 break-words text-wrap max-w-64">
				{(value as Error)?.message ??
					(value as { error: Error })?.error.message}
			</span>
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
							<li
								key={value.id}
								className="flex items-center justify-between rounded-lg px-4 py-1 border relative overflow-hidden"
							>
								{value.read ? null : (
									<div className="absolute top-0.5 left-0.5 rounded-full bg-destructive h-2 w-2" />
								)}
								<div className="flex flex-col">
									<div className="flex flex-col">
										<div className="flex flex-col overflow-hidden">
											<h1 className="line-clamp-1 font-medium">
												{value.content as React.ReactNode}
											</h1>

											<div className="flex">
												<DisplayToastData value={value.data} />
											</div>
										</div>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-muted-foreground text-xs">
											{formatRelative(new Date(value.createdAt), new Date())}
										</span>
										<Button
											title="Archive notification"
											onClick={() => system.remove(value.id)}
											size="icon"
											variant="ghost"
										>
											<Archive className="h-4 w-4" />
										</Button>
									</div>
								</div>
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
									<div className="flex flex-col">
										<h1 className="line-clamp-2 font-semibold border-b mb-1 pb-1">
											{n.title}
										</h1>
										<p className="text-sm text-muted-foreground text-wrap">
											{n.text}
										</p>
									</div>
									<div className="flex justify-between items-center mt-4">
										<div className="text-muted-foreground text-xs">
											{formatRelative(new Date(n.created), new Date())}
										</div>

										<Button
											title="Archive notification"
											onClick={() => modrinth.remove(n.id)}
											size="icon"
											variant="ghost"
										>
											<Archive className="h-4 w-4" />
										</Button>
									</div>
								</div>
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
