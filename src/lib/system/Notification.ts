import { isPermissionGranted, requestPermission, sendNotification, type Options } from '@tauri-apps/api/notification';

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
    constructor() { this.init(); }
    private async init() {
        this.permissionGranted = await isPermissionGranted();
        if (!this.permissionGranted) {
            const permission = await requestPermission();
            this.permissionGranted = permission === 'granted';
        }
    }

    public notify(value: string) {
        this.history.push(value);

        if (!this.permissionGranted) return;
        sendNotification({ body: value, title: "Rusty Minecraft Launcher" });
    }

}