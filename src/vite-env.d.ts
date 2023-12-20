/// <reference types="vite/client" />
/// <reference types="@total-typescript/ts-reset"/>

interface Array<T> {
    toReversed(): Array<T>
}



declare module "@tauri-apps/api/event" {
    export * from "@tauri-apps/api/types/event";
}

declare module "@tauri-apps/api/window" {
    export * from "@tauri-apps/api/types/window";
}

declare module "@tauri-apps/api/process" {
    export * from "@tauri-apps/api/types/process";
}

declare module "@tauri-apps/api/app" {
    export * from "@tauri-apps/api/types/app";
}

declare module "@tauri-apps/api/path" {
    export * from "@tauri-apps/api/types/path";
}

declare module "@tauri-apps/api/fs" {
    export * from "@tauri-apps/api/types/fs";
}