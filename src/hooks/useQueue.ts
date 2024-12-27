import { useQuery } from "@tanstack/react-query";
import { query, sqlValue } from "@lib/api/plugins/query";
import { QueueItem } from "@/lib/models/download_queue";
import type { QueueItemState } from "@/lib/QueueItemState";
import { KEY_DOWNLOAD_QUEUE } from "./keys";
import DownloadManager, {
	DOWNLOAD_MANAGER_EVENT_CURRENT,
} from "@/lib/system/downloadManager";
import { useSyncExternalStore } from "react";

function currentSubscription(callback: () => void) {
	DownloadManager.addEventListener(DOWNLOAD_MANAGER_EVENT_CURRENT, callback);
	return () => {
		DownloadManager.removeEventListener(
			DOWNLOAD_MANAGER_EVENT_CURRENT,
			callback,
		);
	};
}

export function useCurrentQueue() {
	return useSyncExternalStore(currentSubscription, () =>
		DownloadManager.getCurrentSnapshot(),
	);
}

export function useQueue(
	queue: keyof typeof QueueItemState,
	order: "ASC" | "DESC" = "DESC",
) {
	return useQuery({
		queryKey: [KEY_DOWNLOAD_QUEUE, queue],
		queryFn: () =>
			query`SELECT * FROM download_queue WHERE state = ${queue} AND display = TRUE ORDER BY priority ${sqlValue(order)};`
				.as(QueueItem)
				.all(),
	});
}
