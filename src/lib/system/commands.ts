import { invoke } from '@tauri-apps/api';
import { listen, emit, once } from '@tauri-apps/api/event';


export const play = async (settings: any) => {
    await invoke("play", { settings });
}