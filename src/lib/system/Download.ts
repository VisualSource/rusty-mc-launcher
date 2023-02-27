export default class DownloadManager {
    static INSTANCE: null | DownloadManager = null;
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