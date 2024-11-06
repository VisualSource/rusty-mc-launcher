import { useQueue } from "@hook/useQueue";
import type { QueueItemState } from "@/lib/QueueItemState";
import SectionDivider from "./SectionDivider";
import DownloadItem from "./DownloadItem";
import { Button } from "../ui/button";
import { query } from "@/lib/api/plugins/query";
import { queryClient } from "@/lib/api/queryClient";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";

export const DownloadSection: React.FC<{
	label: string;
	order?: "ASC" | "DESC";
	group: keyof typeof QueueItemState;
}> = ({ group, order, label }) => {
	const queue = useQueue(group, order);

	if (queue.isError) return null;
	if (queue.isLoading) return null;
	if (!queue.data?.length) return null;

	return (
		<section className="flex w-full flex-col">
			<SectionDivider label={label} count={queue.data.length}>
				<Button
					size="sm"
					onClick={() => {
						query("DELETE FROM download_queue WHERE state = ?", [group])
							.run()
							.then(() => {
								queryClient.invalidateQueries({
									queryKey: [KEY_DOWNLOAD_QUEUE, group],
								});
							});
					}}
				>
					Clear
				</Button>
			</SectionDivider>
			<div className="flex flex-col gap-2 pl-4 pt-2">
				{queue.data.map((item) => (
					<DownloadItem key={item.id} {...item} />
				))}
			</div>
		</section>
	);
};
