import { invoke } from '@tauri-apps/api';
import { listen, emit, once } from '@tauri-apps/api/event';
import type { LaunchConfig } from './MinecraftProfile';
import Notification from './Notification';

export const install = async (version: string, game_dir?: string) => {
    try {
        await invoke("install", { gameDir: game_dir, version });
    } catch (error) {
        Notification.getInstance().notify((error as Error)?.message ?? "Failed to install");
        console.error(error);
    }
}

export const check_install = async (version: string, game_dir?: string) => {
    try {
        const result = await invoke("check_install", { version, gameDir: game_dir });
        return result;
    } catch (error) {
        console.error(error);
        return false;
    }
}

export const play = async (settings: LaunchConfig) => {
    try {
        await invoke("play", { settings });
    } catch (error) {
        console.error(error);
    }
}

export const stop = async () => {
    await invoke("stop");
}