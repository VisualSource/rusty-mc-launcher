/// <reference types="vite/client" />
/// <reference types="@total-typescript/ts-reset"/>

interface Array<T> {
    toReversed(): Array<T>
}



declare module "@tauri-apps/api/event" {
    export { Event, EventCallback, EventName, once, UnlistenFn } from "@tauri-apps/api/types/event";
}

declare module "@tauri-apps/api/window" {
    export { appWindow } from "@tauri-apps/api/types/window";
}

declare module "@tauri-apps/api/process" {
    export { exit, relaunch } from "@tauri-apps/api/types/process";
}

declare module "@tauri-apps/api/app" {
    export { getName, getTauriVersion, getVersion } from "@tauri-apps/api/types/app";
}