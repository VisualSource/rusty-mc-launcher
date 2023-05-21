import { listen } from '@tauri-apps/api/event';
import { createContext, useState } from 'react';
import update from 'immutability-helper';

import { check_install, install } from '@system/commands';
import useNotification from '@hook/useNotifications';
import logger from '@system/logger';

type QueueItem = {
    ammount: number;
    ammount_current: number;
    size: number;
    size_current: number;
    type: "client" | "mod";
    msg: string;
    download: DownloadEvent | null;
    key: string;
}

type FetchEvent = {
    msg: string;
    ammount: number;
    size: number;
}

type StartEvent = {
    key: string;
    msg: string;
}

type DownloadEvent = {
    file: string;
    size: number;
}

type DownloadClient = {
    queueCurrent: QueueItem | undefined;
    queueNext: QueueItem[];
    queueCompleted: QueueItem[],
    clearCompleted: () => void,
    install: (version: string, game_dir?: string) => Promise<void>
}

export const DownloadContext = createContext<DownloadClient | null>(null);

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
    const [queueCurrent, setQueueCurrent] = useState<QueueItem | undefined>(undefined);
    const [queueNext, setQueueNext] = useState<QueueItem[]>([]);
    const [queueCompleted, setQueueCompleted] = useState<QueueItem[]>([]);
    const notification = useNotification()

    return (
        <DownloadContext.Provider value={{
            queueCurrent,
            queueCompleted,
            queueNext,
            clearCompleted() {
                setQueueCompleted([]);
            },
            async install(version, game_dir) {
                try {
                    const isInstalled = await check_install(version, game_dir);

                    if (!isInstalled) {

                        setQueueCurrent({
                            ammount: 0,
                            ammount_current: 0,
                            download: null,
                            key: "install",
                            msg: "Installing",
                            size: 1720,
                            size_current: 0,
                            type: "client"
                        });

                        const listener = await listen<{ event: "fetch" | "download" | "complete" | "end" | "start"; value: string; }>("mcl::installer", ev => {
                            setTimeout(() => {
                                try {
                                    const data = JSON.parse(ev.payload.value);
                                    switch (ev.payload.event) {
                                        case 'fetch': {
                                            setQueueCurrent(current => {
                                                if (!current) return current;
                                                return {
                                                    ...current,
                                                    ...(data as FetchEvent),
                                                    size_current: 0,
                                                    ammount_current: 0
                                                }
                                            });
                                            break;
                                        }
                                        case 'download': {
                                            setQueueCurrent(current => {
                                                if (!current) return current;
                                                return {
                                                    ...current,
                                                    size_current: current.size_current + (data as DownloadEvent).size,
                                                    ammount_current: current.ammount_current + 1,
                                                    download: (data as DownloadEvent)
                                                }
                                            });
                                            break;
                                        }
                                        case 'start':
                                        case 'end': {
                                            setQueueCurrent(current => {
                                                if (!current) return current;
                                                return {
                                                    ...current,
                                                    msg: (data as StartEvent).msg
                                                }
                                            });
                                        }
                                        case "complete": { }
                                    }
                                } catch (error) {
                                    logger.error(error, ev);
                                }
                            }, 1000);
                        });


                        try {
                            await install(version, game_dir).then(() => {
                                logger.info("Finished Install");
                            });
                            setQueueCurrent((current) => {
                                if (current) setQueueCompleted(completed => update(completed, { $push: [current] }))
                                return undefined;
                            });
                            notification.notify({
                                type: "success",
                                title: "Minecraft Install Status",
                                body: "Minecraft Has been installed"
                            }, true).catch(e => logger.error(e));
                        } catch (error) {
                            notification.notify({
                                type: "error",
                                title: "Minecraft install Status",
                                body: "Failed to install Minecraft"
                            }, true).catch(e => logger.error(e));
                            logger.error(error);
                        }
                        listener();
                    }
                } catch (error) {
                    logger.error(error);
                }
            },
        }}>
            {children}
        </DownloadContext.Provider>
    )
}