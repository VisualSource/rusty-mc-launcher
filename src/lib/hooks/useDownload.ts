import { useContext } from 'react';
import { DownloadContext } from "@context/DownloadContext";
import type { DownloadManager } from '@system/Download';
const useDownload = () => {
    const context = useContext(DownloadContext) as DownloadManager;
    return context;
}

export default useDownload;