import { listen } from '@tauri-apps/api/event';
export default class DownloadManager {
    static INSTANCE: null | DownloadManager = null;
    public queue = {
        completed: [],
        next: []
    }
    static getInstance(): DownloadManager {
        if (!DownloadManager.INSTANCE) {
            DownloadManager.INSTANCE = new DownloadManager();
        }

        return DownloadManager.INSTANCE
    }
    constructor() {
        DownloadManager.INSTANCE = this;
    }
}