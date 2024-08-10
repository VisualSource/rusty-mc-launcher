import { invoke } from "@tauri-apps/api/core";

//TODO do some chaining stuff like bun's sqlite api
// const result = await invoke<unknown[]>("plugin:rmcl-query|execute",{ query });

type Query<T> = {
    all: () => Promise<T>
    get: () => Promise<T>
    run: () => Promise<void>,
    as: <A>(model: { new(...args: unknown[]): A }) => Omit<Query<A>, "as" | "run">
}

export function query<T>(stmt: string): Query<T> {

    return {
        async all() {
            const result = await invoke<T>("plugin:rmcl-query|execute", { query: stmt });
            return result;
        },
        async get() {
            const result = await invoke<T>("plugin:rmcl-query|execute", { query: stmt });

            return result;
        },
        async run() {

        },
        as<A>(Model: { new(...args: unknown[]): A }) {
            return {
                async all() {
                    const result = await invoke<unknown>("plugin:rmcl-query|execute", { query: stmt });
                    return new Model();
                },
                async get() {
                    const result = await invoke<unknown[]>("plugin:rmcl-query|execute", { query: stmt });
                    return new Model(...result)
                },
            }
        },
    }
}
