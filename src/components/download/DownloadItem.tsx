import {
	ArrowUpFromLine,
	FileDiff,
	Monitor,
	PackagePlus,
	RefreshCcw,
	Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import type { QueueItem } from "@/lib/models/download_queue";
import { TypographyH4 } from "@component/ui/typography";
import { QueueItemState } from "@/lib/QueueItemState";
import { queryClient, invalidateQueries } from "@/lib/api/queryClient";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { Button } from "../ui/button";
import { query } from "@/lib/api/plugins/query";
import { formatRelative } from "date-fns/formatRelative";

const QueuItemContent: React.FC<{ state: QueueItem["state"]; id: string }> = ({
	state,
	id,
}) => {
	switch (state) {
		case "ERRORED":
			return (
				<div className="flex gap-2">
					<Button
						title="Retry"
						onClick={async () => {
							await query`UPDATE download_queue SET state = ${QueueItemState.PENDING} WHERE id = ${id};`.run();
							await invalidateQueries([
								[KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
								[KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
							]);
						}}
						size="icon"
						variant="outline"
					>
						<RefreshCcw />
					</Button>
					<Button
						title="Delete"
						onClick={async () => {
							await query`DELETE FROM download_queue WHERE id = ${id};"`.run();
							await queryClient.invalidateQueries({
								queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
							});
						}}
						size="icon"
						variant="destructive"
					>
						<Trash2 />
					</Button>
				</div>
			);
		case "COMPLETED":
			return (
				<div>
					<Button
						title="Delete"
						onClick={async () => {
							await query`DELETE FROM download_queue WHERE id = ${id};`.run();
							await queryClient.invalidateQueries({
								queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.COMPLETED],
							});
						}}
						size="icon"
						variant="destructive"
					>
						<Trash2 />
					</Button>
				</div>
			);
		case "POSTPONED":
			return (
				<div>
					<Button
						onClick={async () => {
							await query`UPDATE download_queue SET state = ${QueueItemState.PENDING} WHERE id = ${id};`.run();
							await invalidateQueries([
								[KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
								[KEY_DOWNLOAD_QUEUE, QueueItemState.POSTPONED],
							]);
						}}
						title="Enqueue"
						size="icon"
						variant="outline"
					>
						<ArrowUpFromLine />
					</Button>
				</div>
			);
		case "PENDING":
			return null;
		default:
			return null;
	}
};

const DownloadItem: React.FC<QueueItem> = ({
	id,
	state,
	display_name,
	content_type,
	completed,
	icon,
}) => {
	return (
		<div className="flex justify-between gap-2">
			<div className="flex items-center gap-2">
				<Avatar className="rounded-none">
					<AvatarFallback className="rounded-lg">
						{content_type === "Client" ? (
							<Monitor />
						) : content_type === "Mod" ? (
							<PackagePlus />
						) : (
							<FileDiff />
						)}
					</AvatarFallback>
					<AvatarImage className="rounded-md" src={icon ?? undefined} />
				</Avatar>
				<div>
					<TypographyH4 className="-mb-2">{display_name}</TypographyH4>
					<span className="text-sm text-accent-foreground font-light">
						{content_type}
						{completed ? (
							<span className="text-muted-foreground">
								{" "}
								| Finished {formatRelative(new Date(), new Date(completed))}
							</span>
						) : null}
					</span>
				</div>
			</div>

			<QueuItemContent state={state} id={id} />
		</div>
	);
};

export default DownloadItem;
