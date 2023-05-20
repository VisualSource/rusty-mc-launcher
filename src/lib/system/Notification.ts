import { isPermissionGranted, requestPermission, sendNotification, type Options } from '@tauri-apps/api/notification';
import update from 'immutability-helper';
import logger from './logger';
export default class Notification {
    private permissionGranted: boolean = false;
    private history: (string | Options)[] = [];
    static INSTANCE: Notification | null = null;
    static getInstance(): Notification {
        if (!Notification.INSTANCE) {
            Notification.INSTANCE = new Notification();
        }
        return Notification.INSTANCE;
    }
    constructor() { this.init().catch(e => console.error(e)); }
    private async init() {
        this.permissionGranted = await isPermissionGranted();
        if (!this.permissionGranted) {
            const permission = await requestPermission();
            this.permissionGranted = permission === 'granted';
        }
        logger.info("Loading Notifications");
    }

    public notify(value: string) {
        logger.info("Notify", value);
        if (!value) return;
        this.history = update<string[]>([], { $push: [value] });
        if (!this.permissionGranted) return;
        sendNotification({ body: value, title: "Rusty Minecraft Launcher" });
    }

}