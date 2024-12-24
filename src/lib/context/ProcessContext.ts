import { type Event, listen, type UnlistenFn } from "@tauri-apps/api/event";
import { createContext } from "react";

const PROCESS_STATE_CHANGE = "rmcl://running-process-state";

export class ProcessState extends EventTarget {
    private subscription: Promise<UnlistenFn>;
    private state: Set<string> = new Set();
    constructor() {
        super();
        this.subscription = listen<{ profile: string, state: boolean }>(PROCESS_STATE_CHANGE, this.onChange);
    }

    public async destory() {
        const listen = await this.subscription
        listen();
    }

    private onChange = (ev: Event<{ profile: string, state: boolean }>) => {
        if (ev.payload.state) {
            this.state.add(ev.payload.profile);
            return;
        }
        this.state.delete(ev.payload.profile);
        this.dispatchEvent(new Event("update"));
    }

    public getState(profile: string) {
        return this.state.has(profile);
    }

    public onEvent = (callback: () => void) => {
        this.addEventListener("state", callback);
        return () => {
            this.removeEventListener("state", callback);
        }
    }
}

export const processContext = createContext<ProcessState | null>(null);