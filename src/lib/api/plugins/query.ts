import { invoke } from "@tauri-apps/api/core";

type Query<T> = {
	all: () => Promise<T[]>;
	get: () => Promise<T | undefined>;
	run: () => Promise<[number, number]>;
	as: <A>(model: { fromQuery(args: QueryResult): A }) => Omit<
		Query<A>,
		"as" | "run"
	>;
};
type RawSql = { isSql: true; stmt: string; args?: unknown[] };
export type TagFunc = (
	strings: TemplateStringsArray,
	...args: unknown[]
) => void;
export type QueryResult = Record<string, string | number | null | boolean>;

//#region Tauri Bindings
const querySelect = <T>(query: string, args: unknown[]) =>
	invoke<T[]>("plugin:rmcl-query|select", { query, args });

const queryExecute = (query: string) =>
	invoke<[number, number]>("plugin:rmcl-query|execute", { query });

const queryPrepare = (query: string, args: unknown[]) =>
	invoke<[number, number]>("plugin:rmcl-query|prepare", { query, args });
//#endregion Tauri Bindings

/**
 * Coverts sql templete string array into a single sql string.
 *
 * Args with a object of ```{ isSql: true, stmt: string, args?: unknown[] }```
 * will be concated into the sql string rather then being replace by a ? param
 */
const parseQuery = (stmts: TemplateStringsArray, args: unknown[], useNumberParams = false) => {
	const values: unknown[] = [];
	let stmt = "";
	let param = 1;
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


		stmt += useNumberParams ? `$${param++}` : "?";
		values.push(arg);
	}

	if (!stmt.endsWith(";")) stmt += ";";

	return {
		stmt,
		args: values,
	};
};

const asString = (arg: unknown): string => {
	switch (typeof arg) {
		case "string":
			return `'${arg}'`;
		case "number":
			return arg.toString();
		case "boolean":
			return arg ? "TRUE" : "FALSE"
		case "object":
			if (arg === null) return "NULL";
			return `'${JSON.stringify(arg)}'`;
		default:
			throw new Error(`Unsupported data type: "${typeof arg}"`, { cause: arg });
	}
}

//#region Public Api


/**
 * Pass a raw sql value
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
 * Function for building and executing mutiple sql querys at once.
 */
export async function transaction(actions: (tx: TagFunc) => void) {
	const stmts: string[] = [];

	const tx: TagFunc = (strings, ...args) => {
		const { stmt, args: finalArgs } = parseQuery(strings, args, true);

		const stringifyArgs = finalArgs.map(arg => asString(arg));

		let param = 1;
		let query = stmt.replaceAll(/\t|\r|\n/g, "");
		for (const arg of stringifyArgs) {
			query = query.replace(`$${param++}`, arg);
		}

		stmts.push(query);
	};

	actions(tx);
	return queryExecute(`BEGIN;${stmts.join("")};COMMIT;`);
}

/**
 * sql string builder
 * 
 * allows for returning value as a model
 */
export function query<T = QueryResult>(
	stmts: TemplateStringsArray,
	...values: unknown[]
): Query<T> {
	const { stmt, args } = parseQuery(stmts, values);

	return {
		all: () => querySelect<T>(stmt, args),
		get: () => querySelect<T>(stmt, args).then((e) => e.at(0)),
		run: () => queryPrepare(stmt, args),
		as<A>(Model: { fromQuery(args: QueryResult): A }) {
			return {
				all: () =>
					querySelect<QueryResult>(stmt, args).then((r) =>
						r.map(Model.fromQuery),
					),
				get: () =>
					querySelect<QueryResult>(stmt, args).then((r) => {
						const v = r.at(0);
						if (!v) return;
						return Model.fromQuery(v);
					}),
			};
		},
	};
}

//#region Public Api