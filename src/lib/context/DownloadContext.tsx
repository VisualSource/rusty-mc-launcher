import { type UnlistenFn, listen, type EventCallback } from '@tauri-apps/api/event';
import Queue, { QueueEvent, type QueueWorker } from 'queue';
import { createContext, useEffect, useState, useSyncExternalStore } from 'react';
import update from 'immutability-helper';

import { check_install, install, installMods } from '@system/commands';

import modrinth, { FileDownload } from '../api/modrinth';
import { getLoaderType } from '@/utils/versionUtils';
import useNotification from '@hook/useNotifications';
import profiles from '../models/profiles';
import logger from '@system/logger';
import { queueFactory } from '@/utils/queue';
import useExternalQueue from '../hooks/useExternalQueue';
import { wait } from '@/utils/timer';

type ModsMetadata = {
    type: "mods",
    mods: FileDownload[],
    profile: string;
    game_dir: string | null
};
type ClientMetadata = {
    type: "client",
    game_dir: string | undefined,
    version: string;
};

type QueueItem = {
    ammount: number;
    ammount_current: number;
    size: number;
    size_current: number;
    type: "client" | "mods";
    msg: string;
    download: DownloadEvent | null;
    key: `${string}-${string}-${string}-${string}-${string}`;
    metadata: ModsMetadata | ClientMetadata
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
    queueErrored: QueueItem[],
    clearCompleted: () => void,
    install: (version: string, game_dir?: string, forceDownload?: boolean) => Promise<void>,
    installMods: (profileId: string, type: "github" | "modrinth", modIds: string[]) => Promise<void>
}

class QueueError extends Error {
    constructor(error: Error, public metadata?: QueueItem) {
        super(error.message, { cause: error.cause });
        this.stack = error.stack;
    }
}

/// 1. load queue info from localstorage 
/// 2. proccess queue
/// 3. on shunt download save to localstorage

export const DownloadContext = createContext<DownloadClient | null>(null);

const install_queue = new Queue();
install_queue.autostart = true;
install_queue.concurrency = 1;

const queues = {
    next: queueFactory<QueueItem>(),
    completed: queueFactory<QueueItem>(),
    errored: queueFactory<QueueItem>(),
}

export const DownloadProvider = ({ children }: React.PropsWithChildren) => {
    const queueCompleted = useExternalQueue<QueueItem>(queues.completed);
    const queueErrored = useExternalQueue<QueueItem>(queues.errored);
    const queueNext = useExternalQueue<QueueItem>(queues.next);
    const [currentItem, setCurrentItem] = useState<QueueItem | undefined>();
    const notification = useNotification();

    useEffect(() => {
        const successHandler = (job: QueueEvent<"success", { result: unknown[]; }>) => {

            const metadata = job.detail.result[0] as QueueItem;

            setCurrentItem(undefined);

            queues.completed.queue.enqueue(metadata);

            notification.notify({
                type: "success",
                title: "Minecraft Launcher",
                body: metadata.type === "client" ? "Minecraft has been installed." : "Minecraft mods have been downloaded."
            }, true).catch(e => logger.error(e));
        }
        const errorHandler = (job: QueueEvent<"error", { error: QueueError; job: QueueWorker; }>) => {
            const error = job.detail.error;
            logger.error(error);

            if (error.metadata) queues.errored.queue.enqueue(error.metadata);
        }

        let lisenter: UnlistenFn;
        listen<{ event: "fetch" | "download" | "complete" | "end" | "start"; value: string; }>("mcl::download", (ev) => {
            setTimeout(() => {
                try {
                    const data = JSON.parse(ev.payload.value);
                    switch (ev.payload.event) {
                        case 'fetch': {
                            setCurrentItem(current => {
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
                            setCurrentItem(current => {
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
                            setCurrentItem(current => {
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
        }).then(value => {
            lisenter = value;
        });

        install_queue.addEventListener("success", successHandler);
        install_queue.addEventListener("error", errorHandler);

        return () => {
            install_queue.removeEventListener("success", successHandler);
            install_queue.removeEventListener("error", errorHandler);
            if (lisenter) lisenter();
        }
    }, []);

    return (
        <DownloadContext.Provider value={{
            queueCurrent: currentItem,
            queueCompleted,
            queueErrored,
            queueNext,
            clearCompleted() { queues.completed.queue.clear() },
            async install(version, game_dir, forceDownload) {
                try {
                    const isInstalled = await check_install(version, game_dir);

                    if (isInstalled && !forceDownload) {
                        document.dispatchEvent(new CustomEvent("mcl::install_ready", { detail: { vaild: true } }));
                        return;
                    }

                    const id = crypto.randomUUID();

                    queues.next.queue.enqueue({
                        ammount: 0,
                        ammount_current: 0,
                        download: null,
                        key: id,
                        msg: "Install Client",
                        size: 0,
                        size_current: 0,
                        type: "client",
                        metadata: {
                            type: "client",
                            game_dir: game_dir,
                            version
                        }
                    });

                    install_queue.push(async (cb) => {
                        if (!cb) throw new Error("Callback handler not avaliable", { cause: "NO_CALLBACK_HANDLER" });

                        const data = queues.next.queue.dequeueItem(id);

                        try {
                            if (!data) throw new Error("Failed to get queue data", { cause: "MISSING_QUEUE_METADATA" });
                            if (data.metadata.type !== "client") throw new Error("Unable to process, non client metadata");

                            setCurrentItem(data);

                            await install(data.metadata.version, data.metadata.game_dir);

                            document.dispatchEvent(new CustomEvent("mcl::install_ready", { detail: { vaild: true } }));

                            cb(undefined, data);
                        } catch (error) {
                            document.dispatchEvent(new CustomEvent("mcl::install_ready", { detail: { vaild: false } }));
                            cb(new QueueError(error as Error, data));
                        }
                    });
                } catch (error) {
                    logger.error(error);
                    notification.toast.alert({
                        title: (error as Error)?.message ?? "Failed to install client",
                        type: "error",
                        body: "Failed to install client"
                    });
                    document.dispatchEvent(new CustomEvent("mcl::install_ready", { detail: { vaild: false } }));
                }
            },
            async installMods(profileId, type, modIds) {
                try {
                    const selectedProfile = await profiles.findOne({ where: [{ id: profileId }] });
                    if (!selectedProfile) throw new Error("Failed to find profile", { cause: "FAILED_FIND_PROFILE" });

                    const loader = getLoaderType(selectedProfile.lastVersionId);
                    if (loader.type === "vanilla") throw new Error("Unable to install mod on given profile.", { cause: "NONMODDED_PROFILE" });

                    if (type === "github") throw new Error("Unable to process Github providers at this time", { cause: "GITHUB_DOWNLOAD_PROVIDER" });

                    const modList = await Promise.all(modIds.map((mod) => modrinth.GetVersionFiles(mod, loader.loader, loader.game)));

                    const files = modList.flat(2);
                    // remove dups
                    const ids = new Set([...files.map(value => value.id), ...(selectedProfile.mods ?? []).map(value => value.id)]);

                    const newlyAddedMods = files.filter(item => !ids.has(item.id));

                    // there are not new mods to download!
                    if (!newlyAddedMods.length) {
                        notification.toast.success({
                            title: "Mods already installed on profile.",
                            type: "success"
                        })
                        return;
                    }

                    await profiles.update({
                        where: [{ id: selectedProfile.id }],
                        data: {
                            mods: (selectedProfile.mods ?? []).concat(newlyAddedMods.map(value => ({ name: value.name, id: value.id, version: value.version })))
                        }
                    });

                    const size = newlyAddedMods.reduce((pre, curr) => pre + curr.download.size, 0);
                    const id = crypto.randomUUID();

                    queues.next.queue.enqueue({
                        ammount: files.length,
                        ammount_current: 0,
                        download: null,
                        key: id,
                        msg: "Installing Mods",
                        size: size,
                        size_current: 0,
                        type: "mods",
                        metadata: {
                            type: "mods",
                            profile: selectedProfile.id,
                            mods: newlyAddedMods,
                            game_dir: selectedProfile.gameDir
                        }
                    });

                    install_queue.push(async (cb) => {
                        if (!cb) throw new Error("Callback handler not avaliable", { cause: "NO_CALLBACK_HANDLER" });
                        const data = queues.next.queue.dequeueItem(id);
                        try {
                            if (!data) throw new Error("Failed to get queue data", { cause: "MISSING_QUEUE_METADATA" });
                            if (data.metadata.type !== "mods") throw new Error("Unable to process, non mod metadata");
                            setCurrentItem(data);

                            await installMods(data.metadata.profile, data.metadata.mods, data.metadata.game_dir ?? undefined);

                            cb(undefined, data);
                        } catch (error) {
                            cb(new QueueError(error as Error),)
                        }
                    });
                } catch (error) {
                    logger.error(error);
                    notification.toast.alert({
                        title: (error as Error)?.message ?? "Failed to download mods.",
                        type: "error",
                        body: "Failed to install mods"
                    });
                }
            },

        }}>
            {children}
        </DownloadContext.Provider>
    )
}