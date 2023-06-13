import { useSyncExternalStore } from 'react';
import { queueFactory } from "@/utils/queue";

const useExternalQueue = <T extends { key: string }>(queue: ReturnType<typeof queueFactory<T>>) => {
    return useSyncExternalStore(queue.subscribe, queue.getSnapshot);
}

export default useExternalQueue;