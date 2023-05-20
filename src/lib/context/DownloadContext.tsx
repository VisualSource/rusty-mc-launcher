import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import { createContext, useState, useEffect } from 'react';
import Kefir from 'kefir'
import { Queue } from '@datastructures-js/queue';
import update from 'immutability-helper';

import { check_install, install } from '@system/commands';
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

                        let events: UnlistenFn[] = [];
                        const buffer = Kefir.stream<{ type: "fetch" | "download" | "end" | "start", data: unknown }, unknown>(emitter => {
                            listen<string>("mcl::i::fetch", ev => {
                                const data = JSON.parse(ev.payload) as FetchEvent;
                                emitter.emit({ type: "fetch", data })
                            }).then(sub => events.push(sub));
                            listen<string>("mcl::i::download", ev => {
                                const data = JSON.parse(ev.payload) as DownloadEvent;
                                emitter.emit({ type: "download", data });
                            }).then(sub => events.push(sub));
                            listen<string>("mcl::i::end", ev => {
                                const data = JSON.parse(ev.payload) as StartEvent;
                                emitter.emit({ type: "end", data })
                            }).then(sub => events.push(sub));
                            listen<string>("mcl::i::start", ev => {
                                const data = JSON.parse(ev.payload) as StartEvent;
                                emitter.emit({ type: "start", data });
                            }).then(sub => events.push(sub));

                            listen<string>("mcl::i::complete", ev => {
                                emitter.end();
                            }).then(sub => events.push(sub));

                            return () => {
                                for (const sub of events) sub();
                            }
                        });


                        buffer.throttle(1000).onValue((item) => {
                            switch (item.type) {
                                case "download": {
                                    const data = item.data as DownloadEvent;
                                    setQueueCurrent((current) => {
                                        if (!current) return current;
                                        return {
                                            ...current,
                                            download: data,
                                            ammount_current: current.ammount_current + 1,
                                            size_current: current.size_current + data.size
                                        }
                                    });
                                    break;
                                }
                                case "fetch": {
                                    const data = item.data as FetchEvent;
                                    setQueueCurrent(current => {
                                        if (!current) return current;
                                        return {
                                            ...current,
                                            msg: data.msg,
                                            ammount: data.ammount,
                                            size: data.size
                                        }
                                    });
                                    break;
                                }
                                case "end":
                                case "start": {
                                    const data = item.data as StartEvent;
                                    setQueueCurrent((current) => {
                                        if (!current) return current;
                                        return {
                                            ...current,
                                            ammount: 0,
                                            ammount_current: 0,
                                            size: 0,
                                            size_current: 0,
                                            msg: data.msg,
                                            key: data.key
                                        }
                                    });
                                    break;
                                }
                            }
                        });


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

                        await install(version, game_dir).then(() => {
                            logger.info("Finished Install");
                        });

                        setQueueCurrent((current) => {
                            if (current) setQueueCompleted(completed => update(completed, { $push: [current] }))
                            return undefined;
                        });
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