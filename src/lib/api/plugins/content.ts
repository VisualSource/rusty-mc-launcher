import { invoke } from "@tauri-apps/api/core";

export type DownloadEvent = { event: "started", data: unknown } | { event: "progress", data: { amount: number } } | { event: "finished", data: unknown }

export async function registerDownloadListener() {

}

export async function getSystemRam() {
    return invoke<number>("plugin:rmcl-content|get_system_ram");
}