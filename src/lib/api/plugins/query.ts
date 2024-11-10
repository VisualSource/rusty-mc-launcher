import { invoke } from "@tauri-apps/api/core";

type Query<T> = {
	all: () => Promise<T[]>;
	get: () => Promise<T | undefined>;
	run: () => Promise<[number, number]>;
	as: <A>(model: { new(args: QueryResult): A }) => Omit<
		Query<A>,
		"as" | "run"
	>;
};


export type QueryResult = Record<string, string | number | null | boolean>;

const querySelect = <T>(query: string, args: unknown[]) => invoke<T[]>("plugin:rmcl-query|select", { query, args });
const queryExecute = (query: string, args: unknown[]) => invoke<[number, number]>("plugin:rmcl-query|execute", { query, args });

type TagFunc = (strings: TemplateStringsArray, ...args: unknown[]) => void;

export async function transaction(actions: (tx: { query: TagFunc, batch: (stmt: string, args: unknown[][]) => void }) => void) {
	const argsList: unknown[] = [];

	const stmts: string[] = [];

	const tx: TagFunc = (strings: TemplateStringsArray, ...args: unknown[]) => {
		argsList.push(...args);
		let stmt = strings.join("?");
		if (!stmt.endsWith(";")) {
			stmt = `${stmt};`;
		}
		stmts.push(stmt);
	}

	const batch = (stmt: string, args: unknown[][]) => {
		const argsLen = args.at(0)?.length ?? 0;
		const values = Array.from({ length: args.length }).map(_ => (
			`(${Array.from({ length: argsLen }).map(_ => "?").join(",")})`
		)).join(",");

		stmts.push(`${stmt} ${values};`);
		argsList.push(...args.flat());
	};

	actions({ query: tx, batch });

	return queryExecute(`BEGIN TRANACTION;${stmts.join("")}END TRANACTION;`, argsList);
}

export async function batch(stmt: string, args: unknown[][]) {
	const argsLen = args.at(0)?.length ?? 0;

	const values = Array.from({ length: args.length }).map(_ => (
		`(${Array.from({ length: argsLen }).map(_ => "?").join(",")})`
	)).join(",");

	return queryExecute(`${stmt} ${values};`, args.flat());
}

export function query<T = QueryResult>(
	stmts: TemplateStringsArray,
	...args: unknown[]
): Query<T> {
	const stmt = stmts.join("?");

	return {
		all: () => querySelect<T>(stmt, args),
		get: () => querySelect<T>(stmt, args).then(e => e.at(0)),
		run: () => queryExecute(stmt, args),
		as<A>(Model: { new(args: QueryResult): A }) {
			return {
				all: () => querySelect<QueryResult>(stmt, args).then(r => r.map(e => new Model(e))),
				get: () => querySelect<QueryResult>(stmt, args).then(r => {
					const v = r.at(0);
					if (!v) return;
					return new Model(v);
				}),
			};
		},
	};
}
