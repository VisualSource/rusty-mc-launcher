import { invoke } from '@tauri-apps/api';
import { listen, emit, once } from '@tauri-apps/api/event';
import Notification from './Notification';

export const install = async (version: string, game_dir: string) => {
    try {
        await invoke("install", { gameDir: game_dir, version });
    } catch (error) {
        Notification.getInstance().notify((error as Error)?.message ?? "Failed to install");
        console.error(error);
    }
}

export const play = async (settings: any) => {
    try {
        await invoke("play", { settings });
    } catch (error) {
        console.error(error);
    }
}

export const stop = async () => {
    await invoke("stop");
}