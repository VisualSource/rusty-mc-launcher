import { getName, getVersion } from '@tauri-apps/api/app';
import localforage from 'localforage';

export const initStorage = async () => {
    try {
        const [name, version] = await Promise.all([
            getName(),
            getVersion()
        ]);

        localforage.config({
            name,
            version: 1.0,
            description: "Internal Storage",
            storeName: "userdata"
        });
    } catch (error) {
        console.error(error);
    }
}


