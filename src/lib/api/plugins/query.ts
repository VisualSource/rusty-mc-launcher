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

type RawSql = { isSql: true; stmt: string; args?: unknown[] };
type TagFunc = (strings: TemplateStringsArray, ...args: unknown[]) => void;
export type QueryResult = Record<string, string | number | null | boolean>;

const querySelect = <T>(query: string, args: unknown[]) =>
	invoke<T[]>("plugin:rmcl-query|select", { query, args });
const queryExecute = (query: string, args: unknown[]) =>
	invoke<[number, number]>("plugin:rmcl-query|execute", { query, args });

/** functions for passing raw sql values */

/**
 * Pass a a raw sql value to parser
 */
export const sqlValue = (value: string): RawSql => ({
	isSql: true,
	stmt: value,
});
/**
 * Build a param list out of a list of values. example ```(?,?,?,?),(?,?,?,?)```
 */
export const bulk = (values: unknown[][]): RawSql => {
	const argsLen = values.at(0)?.length ?? 0;
	const stmt = Array.from({ length: values.length })
		.map(
			(_) =>
				`(${Array.from({ length: argsLen })
					.map((_) => "?")
					.join(",")})`,
		)
		.join(",");

	return { isSql: true, stmt, args: values.flat() };
};

/**
 * Coverts sql templete string array into a single sql string.
 *
 * Args with a object of ```{ isSql: true, stmt: string, args?: unknown[] }```
 * will be concated into the sql string rather then being replace by a ? param
 */
const parseQuery = (stmts: TemplateStringsArray, args: unknown[]) => {
	const values: unknown[] = [];
	let stmt = "";

	for (let index = 0; index < stmts.length; index++) {
		stmt += stmts[index];

		if (index >= args.length) continue;

		const arg = args[index];

		if (arg && typeof arg === "object" && "isSql" in arg && "stmt" in arg) {
			stmt += arg.stmt;
			if ("args" in arg && Array.isArray(arg.args)) {
				values.push(...arg.args);
			}
			continue;
		}

		stmt += "?";
		values.push(arg);
	}

	if (!stmt.endsWith(";")) stmt += ";";

	return {
		stmt,
		args: values,
	};
};

/**
 * Builds a sql tranaction
 */
export async function transaction(actions: (tx: TagFunc) => void) {
	const argsList: unknown[] = [];

	const stmts: string[] = [];

	const tx: TagFunc = (strings, ...values) => {
		const { stmt, args } = parseQuery(strings, values);
		argsList.push(...args);
		stmts.push(stmt);
	};

	actions(tx);

	return queryExecute(
		`BEGIN TRANSACTION;
							${stmts.join("")} 
						COMMIT;`,
		argsList,
	);
}

export function query<T = QueryResult>(
	stmts: TemplateStringsArray,
	...values: unknown[]
): Query<T> {
	const { stmt, args } = parseQuery(stmts, values);

	return {
		all: () => querySelect<T>(stmt, args),
		get: () => querySelect<T>(stmt, args).then((e) => e.at(0)),
		run: () => queryExecute(stmt, args),
		as<A>(Model: { new (args: QueryResult): A }) {
			return {
				all: () =>
					querySelect<QueryResult>(stmt, args).then((r) =>
						r.map((e) => new Model(e)),
					),
				get: () =>
					querySelect<QueryResult>(stmt, args).then((r) => {
						const v = r.at(0);
						if (!v) return;
						return new Model(v);
					}),
			};
		},
	};
}
