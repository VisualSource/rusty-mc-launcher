import { useQuery } from "@tanstack/react-query";
import { QueueItem } from "@/lib/models/download_queue";
import { QueueItemState } from "@/lib/QueueItemState";
import { KEY_DOWNLOAD_QUEUE } from "./keys";
import { query } from "@lib/api/plugins/query";

export function useCurrentQueue() {
	return useQuery({
		queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.CURRENT],
		initialData: null,
		refetchInterval: 30_000,
		queryFn: async () => {
			const item = await query("SELECT * FROM download_queue WHERE state = 'CURRENT' LIMIT 1;")
				.as(QueueItem)
				.get();
			return item ?? null;
		},
	});
}

export function useQueue(
	queue: keyof typeof QueueItemState,
	order: "ASC" | "DESC" = "DESC",
) {
	return useQuery({
		queryKey: [KEY_DOWNLOAD_QUEUE, queue],
		refetchInterval: 60_000,
		queryFn: () =>
			query(
				`SELECT * FROM download_queue WHERE state = ? AND display = TRUE ORDER BY priority ${order};`,
				[queue],
			)
				.as(QueueItem)
				.all(),
	});
}
