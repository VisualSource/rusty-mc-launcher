import { createContext } from 'react';
import type DownloadManager from '@system/Download';

export const DownloadContext = createContext<DownloadManager | null>(null);

export const DownloadProvider = ({ children, client }: React.PropsWithChildren<{ client: DownloadManager }>) => {
    return (
        <DownloadContext.Provider value={client}>
            {children}
        </DownloadContext.Provider>
    )
}