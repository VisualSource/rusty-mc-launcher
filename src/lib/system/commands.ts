import { invoke } from '@tauri-apps/api';
import type { LaunchConfig } from './launch_config';
import logger from './logger';
import { FileDownload } from '../api/modrinth';

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

export const installMods = async (id: string, files: FileDownload[], game_dir?: string) => {
    await invoke("install_mods", { id, gameDir: game_dir, files });
}

export const install = async (version: string, game_dir?: string) => {
    try {
        await invoke("install", { gameDir: game_dir, version });
    } catch (error) {
        logger.error(error);
    }
}

export const check_install = async (version: string, game_dir?: string) => {
    try {
        const result = await invoke<boolean>("check_install", { version, gameDir: game_dir });
        return result;
    } catch (error) {
        logger.error(error);
        return false;
    }
}

export const play = async (settings: LaunchConfig) => invoke("play", { settings });

export const stop = async () => {
    await invoke("stop");
}