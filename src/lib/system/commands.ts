import { invoke } from '@tauri-apps/api';
import type { LaunchConfig } from './launch_config';
import Notification from './Notification';
import logger from './logger';

export class PortGenerator {
    static INSTANCE: PortGenerator | null;
    static getInstance(): PortGenerator {
        if (!PortGenerator.INSTANCE) {
            PortGenerator.INSTANCE = new PortGenerator();
        }
        return PortGenerator.INSTANCE;
    }
    public port: number = 3000;
    constructor() { }
    setPort() {
        this.port = [3000, 4000, 5000].at(Math.floor((Math.random() * 100) % 3)) ?? 3000;
        return this.port;
    }
}

export const startAuthServer = async () => {
    try {
        const generator = PortGenerator.getInstance();
        await invoke("start_server", { port: generator.port, origin: window.location.origin });
        return generator.port;
    } catch (error) {
        logger.error(error);
        return null;
    }
}

export const install = async (version: string, game_dir?: string) => {
    try {
        await invoke("install", { gameDir: game_dir, version });
    } catch (error) {
        Notification.getInstance().notify((error as Error)?.message ?? "Failed to install");
        logger.error(error);
    }
}

export const check_install = async (version: string, game_dir?: string) => {
    try {
        const result = await invoke("check_install", { version, gameDir: game_dir });
        return result;
    } catch (error) {
        logger.error(error);
        return false;
    }
}

export const play = async (settings: LaunchConfig) => {
    try {
        await invoke("play", { settings });
    } catch (error) {
        logger.error(error);
    }
}

export const stop = async () => {
    await invoke("stop");
}