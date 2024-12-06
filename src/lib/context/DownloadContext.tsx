import { Channel } from "@tauri-apps/api/core";
import { createContext, useSyncExternalStore } from "react";
import { error } from "@tauri-apps/plugin-log"
import { toast } from "react-toastify";
import AskDialog from "@/components/dialog/AskDialog";
import { queryClient } from "@lib/api/queryClient";
import { QueueItemState } from "../QueueItemState";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import {
	registerDownloadListener,
	type DownloadEvent,
} from "../api/plugins/content";
import { Updater } from "../system/updater";

class DownloadManager extends EventTarget {
	private updater = new Updater();
	private channel = new Channel<DownloadEvent>();
	private progress: { amount: number; max: number; status: string } | null =
		null;

	constructor() {
		super();
		this.channel.onmessage = this.handler;
		registerDownloadListener(this.channel);
		this.updater
			.checkForUpdate()
			.catch((e) => error((e as Error).message));
	}

	private handler = async (ev: DownloadEvent) => {
		switch (ev.event) {
			case "started":
				this.progress = {
					amount: 0,
					max: ev.data.max_progress,
					status: ev.data.message,
				};
				break;
			case "progress":
				if (!this.progress) break;
				if (ev.data.message) this.progress.status = ev.data.message;
				if (ev.data.amount) this.progress.amount += ev.data.amount;
				break;
			case "finished":
				break;
			default:
				break;
		}
		this.dispatchEvent(new Event("update"));
		//console.log(ev);
		//const data = JSON.parse(ev.payload.value) as Record<string, unknown>;

		/*switch (ev.event) {
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
					message:
						(data?.message as string | undefined) ??
						this.current_progress.message,
					file:
						(data?.file as string | undefined) ?? this.current_progress.file,
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
			case "done": {
				if (Array.isArray(data.keys)) {
					queryClient.invalidateQueries({ queryKey: data.keys });
				}
				break;
			}
		}
		this.dispatchEvent(new Event("update"));*/
	};

	public getSnapshot = () => {
		return this.progress;
	};
}

/// 1. load queue info from localstorage
/// 2. proccess queue
/// 3. on shunt download save to localstorage

export const DownloadContext = createContext<{
	progress: { amount: number; max: number; status: string } | null;
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
