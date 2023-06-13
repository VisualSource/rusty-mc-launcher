export default class ItemQueue<T extends { key: string }> extends EventTarget {
    public data: Array<T> = [];

    public enqueue(item: T) {
        this.data.push(item);
        this.dispatchEvent(new CustomEvent("enqueue"));
    }
    public dequeue(): T | undefined {
        this.dispatchEvent(new CustomEvent("dequeue"));
        return this.data.shift();
    }
    public clear() {
        this.data = [];
        this.dispatchEvent(new CustomEvent("dequeue"));
    }
    public dequeueItem(key: string) {

        const index = this.data.findIndex(data => data.key === key);

        const item = this.data.splice(index, 1).at(0);

        this.dispatchEvent(new CustomEvent("dequeue"));

        return item;
    }
}

export const queueFactory = <T extends { key: string }>() => {
    const queue = new ItemQueue<T>();

    return {
        queue,
        getSnapshot() {
            return queue.data;
        },
        subscribe(callback: () => void) {
            queue.addEventListener("enqueue", callback);
            queue.addEventListener("dequeue", callback);
            return () => {
                queue.removeEventListener("enqueue", callback);
                queue.removeEventListener("dequeue", callback);
            }
        }
    }
}