import { type UnlistenFn, listen, type EventCallback } from "@tauri-apps/api/event";
import { createContext, useSyncExternalStore } from "react";
import { toast } from "react-toastify";

import AskDialog from "@/components/dialog/AskDialog";
import { queryClient } from "@lib/api/queryClient";
import { QueueItemState } from "../QueueItemState";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";

type Progress = {
	message: string;
	max_progress: number;
	progress: number;

	file: string;
};

type DownloadEvent = {
	event: "group" | "update" | "notify" | "refresh" | "reset" | "done";
	value: string;
};

class DownloadManager extends EventTarget {
	private unsubscribe: Promise<UnlistenFn>;
	private current_progress: null | Progress = null;

	constructor() {
		super();
		this.unsubscribe = listen<DownloadEvent>("rmcl://download", this.handler);
	}

	private handler: EventCallback<DownloadEvent> = (ev) => {
		const data = JSON.parse(ev.payload.value) as Record<string, unknown>;

		switch (ev.payload.event) {
			case "group":
				this.current_progress = {
					message: (data?.message as string | undefined) ?? "",
					progress: (data?.progress as number | undefined) ?? 0,
					max_progress: (data?.max_progress as number | undefined) ?? 0,
					file: (data?.file as string | undefined) ?? "",
				};
				break;
			case "update": {
				if (!this.current_progress) break;
				this.current_progress = {
					message: (data?.message as string | undefined) ?? this.current_progress.message,
					file: (data?.file as string | undefined) ?? this.current_progress.file,
					max_progress: this.current_progress.max_progress,
					progress:
						this.current_progress.progress +
						((data?.progress as number | undefined) ?? 0),
				};
				break;
			}
			case "refresh": {
				queryClient.invalidateQueries({
					queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
				});
				queryClient.invalidateQueries({
					queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
				});
				queryClient.invalidateQueries({
					queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.COMPLETED],
				});
				queryClient.invalidateQueries({
					queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.POSTPONED],
				});
				queryClient.invalidateQueries({
					queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.CURRENT],
				});
				break;
			}
			case "notify": {
				switch (data?.type) {
					case "ok": {
						toast.success(data.message as string);
						break;
					}
					case "error": {
						toast.error(data.message as string, {
							data: { error: data?.error ?? "Unknown Error" },
						});
						break;
					}
					default:
						toast.info(data.message as string);
						break;
				}
				break;
			}
			case "reset": {
				this.current_progress = null;
				break;
			}
			case "done": {
				if (Array.isArray(data.keys)) {
					queryClient.invalidateQueries({ queryKey: data.keys })
				}
				break;
			}
		}
		this.dispatchEvent(new Event("update"));
	};

	public getSnapshot = () => {
		return this.current_progress;
	};
}

/// 1. load queue info from localstorage
/// 2. proccess queue
/// 3. on shunt download save to localstorage

export const DownloadContext = createContext<{
	progress: Progress | null;
} | null>(null);

const download_manager = new DownloadManager();

function subscribe(callback: () => void) {
	download_manager.addEventListener("update", callback);
	return () => {
		download_manager.removeEventListener("update", callback);
	};
}

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
	const progress = useSyncExternalStore(
		subscribe,
		download_manager.getSnapshot,
	);

	return (
		<DownloadContext.Provider value={{ progress }}>
			{children}
			<AskDialog />
		</DownloadContext.Provider>
	);
};
