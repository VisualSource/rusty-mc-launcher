import {
	type Event as TauriEvent,
	listen,
	type UnlistenFn,
} from "@tauri-apps/api/event";
import { exit } from "@tauri-apps/plugin-process";
import { listActiveProcesses } from "../api/plugins/game";
import { isOption } from "../models/settings";

const EVENT_PROCESS_STATE = "rmcl::process-state";
const EVENT_PROCESS_CRASH = "rmcl::process-crash";
const UPDATE_EVENT = "update";
export const CRASH_EVENT = "crash";

type ProcessStateEvent =
	| { type: "Add"; data: string }
	| { type: "Remove"; data: string[] };
export type ProcessCrashEvent = {
	profile: string;
	code: number;
	details: string;
};

export class ProcessState extends EventTarget {
	private stateSubscription: Promise<UnlistenFn>;
	private crashSubscription: Promise<UnlistenFn>;
	private state: Set<string> = new Set();
	constructor() {
		super();
		this.stateSubscription = listen<ProcessStateEvent>(
			EVENT_PROCESS_STATE,
			this.onState,
		);
		this.crashSubscription = listen<ProcessCrashEvent>(
			EVENT_PROCESS_CRASH,
			this.onCrash,
		);

		listActiveProcesses()
			.then((ev) => {
				for (const id of ev.data) this.state.add(id);
			})
			.catch((e) => {
				console.error(e);
				//error((e as Error).message);
			});
	}
	public async destory() {
		const [stateSub, crashSub] = await Promise.all([
			this.stateSubscription,
			this.crashSubscription,
		]);
		stateSub();
		crashSub();
	}
	private onCrash = (ev: TauriEvent<ProcessCrashEvent>) => {
		this.state.delete(ev.payload.profile);
		this.dispatchEvent(new Event(UPDATE_EVENT));
		this.dispatchEvent(
			new CustomEvent<ProcessCrashEvent>(CRASH_EVENT, { detail: ev.payload }),
		);
	};
	private onState = async (ev: TauriEvent<ProcessStateEvent>) => {
		switch (ev.payload.type) {
			case "Add": {
				this.state.add(ev.payload.data);

				const exitOnStart = await isOption("option.exit_on_start", "TRUE");
				if (exitOnStart) {
					setTimeout(() => exit(0).catch((e) => console.error(e)), 6000);
				}
				break;
			}
			case "Remove":
				for (const id of ev.payload.data) this.state.delete(id);
				break;
			default:
				break;
		}
		this.dispatchEvent(new Event(UPDATE_EVENT));
	};
	public isProfileRunning(profile: string): boolean {
		return this.state.has(profile);
	}
	public onSync = (callback: () => void) => {
		this.addEventListener(UPDATE_EVENT, callback);
		return () => {
			this.removeEventListener(UPDATE_EVENT, callback);
		};
	};
}
