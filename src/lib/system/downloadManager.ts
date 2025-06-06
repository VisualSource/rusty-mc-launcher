import { Channel } from "@tauri-apps/api/core";

import {
	type DownloadCurrentItem,
	registerDownloadListener,
	type DownloadEvent,
} from "../api/plugins/content";
import { invalidateQueries, queryClient } from "@lib/api/queryClient";
import { QueueItemState } from "../QueueItemState";
import { KEY_DOWNLOAD_QUEUE, KEY_PROFILE } from "@/hooks/keys";
import { toastSuccess } from "../toast";

export const DOWNLOAD_MANAGER_EVENT_PROGRESS = "update::progress";
export const DOWNLOAD_MANAGER_EVENT_CURRENT = "update::current";

const UpdateQueues = (profile: string) =>
	invalidateQueries([
		[KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
		[KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
		[KEY_DOWNLOAD_QUEUE, QueueItemState.COMPLETED],
		[KEY_DOWNLOAD_QUEUE, QueueItemState.POSTPONED],
		[KEY_PROFILE, profile],
	]);

class DownloadManager extends EventTarget {
	static INSTANCE: DownloadManager | null = null;
	static get() {
		if (!DownloadManager.INSTANCE)
			throw new Error("No download manager instance");
		return DownloadManager.INSTANCE;
	}
	static getOrCreate() {
		if (!DownloadManager.INSTANCE) {
			DownloadManager.INSTANCE = new DownloadManager();
		}
		return DownloadManager.INSTANCE;
	}

	private channel = new Channel<DownloadEvent>();
	private current: DownloadCurrentItem | null = null;
	private progress: { amount: number; max: number; status: string } | null =
		null;

	private constructor() {
		super();
		this.channel.onmessage = this.handler;
		registerDownloadListener(this.channel);
	}

	private handler = async (ev: DownloadEvent) => {
		switch (ev.event) {
			case "init":
				this.current = ev.data;
				this.progress = { amount: 0, max: 100, status: "Preparing" };
				this.dispatchEvent(new Event(DOWNLOAD_MANAGER_EVENT_CURRENT));
				await UpdateQueues(this.current.profile).catch((e) => console.error(e));
				break;
			case "started": {
				this.progress = {
					amount: 0,
					max: ev.data.max_progress,
					status: ev.data.message,
				};
				this.dispatchEvent(new Event(DOWNLOAD_MANAGER_EVENT_PROGRESS));
				break;
			}
			case "progress": {
				if (this.progress === null) break;
				if (ev.data.message)
					this.progress = {
						...this.progress,
						status: ev.data.message,
					};
				if (ev.data.amount)
					this.progress = {
						...this.progress,
						amount: this.progress.amount + ev.data.amount,
					};
				this.dispatchEvent(new Event(DOWNLOAD_MANAGER_EVENT_PROGRESS));
				break;
			}
			case "finished": {
				await new Promise((ok) => setTimeout(ok, 3000));

				this.progress = null;
				this.dispatchEvent(new Event(DOWNLOAD_MANAGER_EVENT_CURRENT));
				this.dispatchEvent(new Event(DOWNLOAD_MANAGER_EVENT_PROGRESS));
				await UpdateQueues(this.current?.profile ?? "").catch((e) =>
					console.error(e),
				);
				this.current = null;
				break;
			}
			case "refreshProfile":
				queryClient.invalidateQueries({
					queryKey: [KEY_PROFILE, this.current?.profile ?? ""],
				}).catch(e => console.error(e));
				break;

			case "invalidateQuery": {
				queryClient.invalidateQueries({
					queryKey: ev.data.query_key
				}).catch(e => console.error(e));
				break;
			}
			case "toast": {
				if (ev.data.status === "success") {
					toastSuccess({ title: "Download", description: ev.data.message });
				}

				break;
			}
			default:
				console.error("Unknown event", ev);
				break;
		}
	};

	public getCurrentSnapshot = () => this.current;
	public getProgressSnapshot = () => this.progress;
}

const downloadManager = DownloadManager.getOrCreate();

export default downloadManager;
