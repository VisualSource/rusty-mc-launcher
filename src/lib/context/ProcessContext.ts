import { type Event as TauriEvent, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { createContext } from "react";

const EVENT_PROCESS_STATE = "rmcl::process-state";
const EVENT_PROCESS_CRASH = "rmcl::process-crash";
const UPDATE_EVENT = "update";
export const CRASH_EVENT = "crash";

type ProcessStateEvent = { type: "Add", data: string } | { type: "Remove", data: string[] } | { type: "Init", data: string[] };
export type ProcessCrashEvent = { profile: string, code: number };

export class ProcessState extends EventTarget {
    private stateSubscription: Promise<UnlistenFn>;
    private crashSubscription: Promise<UnlistenFn>;
    private state: Set<string> = new Set();
    constructor() {
        super();
        this.stateSubscription = listen<ProcessStateEvent>(EVENT_PROCESS_STATE, this.onState);
        this.crashSubscription = listen<ProcessCrashEvent>(EVENT_PROCESS_CRASH, this.onCrash);
    }
    public async destory() {
        const [stateSub, crashSub] = await Promise.all([this.stateSubscription, this.crashSubscription]);
        stateSub();
        crashSub();
    }
    private onCrash = (ev: TauriEvent<ProcessCrashEvent>) => {
        this.state.delete(ev.payload.profile);
        this.dispatchEvent(new Event(UPDATE_EVENT));
        this.dispatchEvent(new CustomEvent<ProcessCrashEvent>(CRASH_EVENT, { detail: ev.payload }));
    }
    private onState = (ev: TauriEvent<ProcessStateEvent>) => {
        switch (ev.payload.type) {
            case "Add":
                this.state.add(ev.payload.data);
                break;
            case "Remove":
                for (const id of ev.payload.data) this.state.delete(id);
                break;
            case "Init":
                for (const id of ev.payload.data) this.state.add(id);
                break;
            default:
                break;
        }
        this.dispatchEvent(new Event(UPDATE_EVENT));
    }
    public isProfileRunning(profile: string): boolean {
        return this.state.has(profile);
    }
    public onSync = (callback: () => void) => {
        this.addEventListener(UPDATE_EVENT, callback);
        return () => {
            this.removeEventListener(UPDATE_EVENT, callback);
        }
    }
}

export const processContext = createContext<ProcessState | null>(null);