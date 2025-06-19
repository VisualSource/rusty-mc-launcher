import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { TypographyMuted } from "@/components/ui/typography";
import type { Project } from "@/lib/api/modrinth";
import type { ContentItem } from "@/lib/models/content";
import { Link } from "@tanstack/react-router";
import type { VirtualItem } from "@tanstack/react-virtual";
import { Box, RefreshCcw, Trash2 } from "lucide-react";

export const ContentListItem: React.FC<{
	uninstall: (index: number) => void;
	checkForUpdate: (record: ContentItem, project: Project) => Promise<void>;
	isModpack: boolean;
	item: VirtualItem;
	data?: {
		record: ContentItem;
		project: Project | null;
	};
}> = ({ item, data, checkForUpdate, uninstall, isModpack }) => {
	return (
		<div
			className="absolute left-0 top-0 inline-flex w-full items-center gap-2 pr-2"
			style={{
				height: `${item.size}px`,
				transform: `translateY(${item.start}px)`,
			}}
		>
			<Avatar className="rounded-md">
				<AvatarFallback className="rounded-md">
					<Box />
				</AvatarFallback>
				<AvatarImage src={data?.project?.icon_url ?? undefined} />
			</Avatar>
			<div>
				{data?.project ? (
					<Link
						to="/workshop/project/$id"
						params={{ id: data?.project?.id ?? "" }}
						className="-mb-1 line-clamp-1 underline font-medium"
					>
						{data?.project?.title}
					</Link>
				) : (
					<h1 className="-mb-1 line-clamp-1">
						{data?.project?.title ?? data?.record?.file_name}
					</h1>
				)}
				<TypographyMuted className="text-xs font-mono">
					{data?.record?.version
						? `Version: ${data?.record?.version}`
						: (data?.record?.file_name ?? "Unknown")}
				</TypographyMuted>
			</div>
			{!isModpack ? (
				<div className="ml-auto">
					{data?.project ? (
						<Button
							onClick={async () =>
								checkForUpdate(data.record, data.project as Project)
							}
							title="Check for update"
							variant="ghost"
							className="mr-2 h-5 w-5"
							size="icon"
						>
							<RefreshCcw className="h-5 w-5 hover:animate-spin" />
						</Button>
					) : null}
					<Button
						variant="destructive"
						size="icon"
						title="Delete Mod"
						onClick={() => uninstall(item.index)}
					>
						<Trash2 className="h-5 w-5" />
					</Button>
				</div>
			) : null}
		</div>
	);
};
