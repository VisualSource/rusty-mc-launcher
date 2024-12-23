import DownloadManager, { DOWNLOAD_MANAGER_EVENT_PROGRESS } from "@/lib/system/downloadManager";
import { useSyncExternalStore } from "react";

function progressSubscription(callback: () => void) {
    DownloadManager.addEventListener(DOWNLOAD_MANAGER_EVENT_PROGRESS, callback);
    return () => {
        DownloadManager.removeEventListener(DOWNLOAD_MANAGER_EVENT_PROGRESS, callback);
    };
}

export const useDownloadProgress = () => {
    return useSyncExternalStore(progressSubscription, () => DownloadManager.getProgressSnapshot());
}