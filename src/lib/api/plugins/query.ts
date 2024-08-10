import { invoke } from "@tauri-apps/api/core";

//TODO do some chaining stuff like bun's sqlite api
// const result = await invoke<unknown[]>("plugin:rmcl-query|execute",{ query });

type Query<T> = {
    all: () => Promise<T[]>
    get: () => Promise<T | undefined>
    run: () => Promise<void>,
    as: <A>(model: { new(...args: unknown[]): A }) => Omit<Query<A>, "as" | "run">
}

export function query<T>(stmt: string, args: unknown[]): Query<T> {

    return {
        async all() {
            const result = await invoke<T[]>("plugin:rmcl-query|execute", { query: stmt, args });
            return result;
        },
        async get() {
            const result = await invoke<T[]>("plugin:rmcl-query|execute", { query: stmt, args });
            return result.at(0);
        },
        async run() {

        },
        as<A>(Model: { new(...args: unknown[]): A }) {
            return {
                async all() {
                    const result = await invoke<unknown[]>("plugin:rmcl-query|execute", { query: stmt, args });
                    return result.map(() => new Model());
                },
                async get() {
                    const result = await invoke<unknown[]>("plugin:rmcl-query|execute", { query: stmt, args });

                    const value = result.at(0)
                    if (!value) return undefined;

                    return new Model(...result)
                },
            }
        },
    }
}
