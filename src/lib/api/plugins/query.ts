import { invoke } from "@tauri-apps/api/core";

type Query<T> = {
	all: () => Promise<T[]>;
	get: () => Promise<T | undefined>;
	run: () => Promise<[number, number]>;
	as: <A>(model: { new (args: QueryResult): A }) => Omit<
		Query<A>,
		"as" | "run"
	>;
};

export type QueryResult = Record<string, string | number | null | boolean>;

export function query<T = QueryResult>(
	stmt: string,
	args: unknown[] = [],
): Query<T> {
	return {
		async all() {
			const result = await invoke<T[]>("plugin:rmcl-query|select", {
				query: stmt,
				args,
			});
			return result;
		},
		async get() {
			const result = await invoke<T[]>("plugin:rmcl-query|select", {
				query: stmt,
				args,
			});
			return result.at(0);
		},
		async run() {
			return invoke<[number, number]>("plugin:rmcl-query|execute", {
				query: stmt,
				args,
			});
		},
		as<A>(Model: { new (args: QueryResult): A }) {
			return {
				async all() {
					const result = await invoke<QueryResult[]>(
						"plugin:rmcl-query|select",
						{ query: stmt, args },
					);
					return result.map((e) => new Model(e));
				},
				async get() {
					const result = await invoke<QueryResult[]>(
						"plugin:rmcl-query|select",
						{ query: stmt, args },
					);
					const value = result.at(0);
					if (!value) return undefined;

					return new Model(value);
				},
			};
		},
	};
}
