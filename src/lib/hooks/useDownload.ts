import { useContext } from 'react';
import { DownloadContext } from "@context/DownloadContext";
import type DownloadManager from '@system/Download';
const useDownload = () => {
    const context = useContext(DownloadContext) as DownloadManager;
    if (!context) throw new Error("useDownload needs to be wraped in a DownloadProvider");

    return context;
}

export default useDownload;