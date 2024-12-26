import {
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
import { queryClient } from "@/lib/api/queryClient";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { Button } from "../ui/button";
import { query } from "@/lib/api/plugins/query";

const DownloadItem: React.FC<QueueItem> = ({
	id,
	state,
	display_name,
	content_type,
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
					<span className="text-sm text-zinc-400">{content_type}</span>
				</div>
			</div>

			{state === "COMPLETED" ? (
				<div>
					<Button
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
			) : null}

			{state === "ERRORED" ? (
				<div className="flex gap-2">
					<Button
						onClick={async () => {
							await query`UPDATE download_queue SET state = ${QueueItemState.PENDING} WHERE id = ${id};`.run();
							await queryClient.invalidateQueries({
								queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
							});
							await queryClient.invalidateQueries({
								queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
							});
						}}
						size="icon"
						variant="outline"
					>
						<RefreshCcw />
					</Button>
					<Button
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
			) : null}
		</div>
	);
};

export default DownloadItem;
