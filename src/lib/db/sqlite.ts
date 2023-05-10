import { writeBinaryFile, exists, BaseDirectory } from '@tauri-apps/api/fs';
import SQLite from 'tauri-plugin-sqlite-api';
import logger from '@system/logger';

type DB_Type = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB";
type DB_Type_Extend = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB" | "DATE" | "JSON" | "BOOLEAN";
type DefaultType<T extends DB_Type_Extend, J = unknown> =
    T extends "DATE" ? "CURRENT_TIMESTAMP" | "CURRENT_DATE" | "CURRENT_TIME" : never
    | T extends "JSON" ? J : never
    | T extends "BOOLEAN" ? "TRUE" | "FALSE" : never;

type InferType<T> = T extends Type<infer R, infer N, infer J> ?
    (R extends "JSON" ? J : never)
    | (R extends "NULL" ? null : never)
    | (R extends "INTEGER" ? number : never)
    | (R extends "REAL" ? number : never)
    | (R extends "TEXT" ? string : never)
    | (R extends "BLOG" ? string : never)
    | (R extends "BOOLEAN" ? boolean : never)
    | (R extends "DATE" ? Date : never)
    | (R extends "DATETIME" ? Date : never)
    | (R extends "NUMERIC" ? number : never)
    | (N extends "null" ? null : never)
    : never;
type SchemaType<P> = { [K in keyof P]: InferType<P[K]> };
type PartialScheam<P> = Partial<SchemaType<P>>
type WhereStatment<P> = [PartialScheam<P>, ...Array<{
    AND?: PartialScheam<P>,
    OR?: PartialScheam<P>
}>]
type SchemaFind<P> = {
    where?: WhereStatment<P>,
    select?: Partial<Record<keyof P, true>>,
    order?: Partial<Record<keyof P, "ASC" | "DESC">>,
    limit?: number;
}
type ScheamUpdate<P> = {
    data: PartialScheam<P>,
    where?: WhereStatment<P>,
};
type SchemaDelete<P> = {
    where: WhereStatment<P>
}


export type InferSchema<P> = P extends Schema<infer S> ? SchemaType<S> : never;

const DATABASE_FILE = "./database.db";

const enum Nullable {
    Default,
    Nullable,
    NonNullable
}

export class Type<TDB extends DB_Type_Extend, TNull extends "non_null" | "null" = "non_null", TJson = unknown> {
    static Integer = () => new Type("INTEGER", "INTEGER");
    static Boolean = () => new Type("INTEGER", "BOOLEAN");
    static Real = () => new Type("REAL", "REAL");
    static Text = () => new Type("TEXT", "TEXT");
    static Blob = () => new Type("BLOB", "BLOB");
    static Date = () => new Type("TEXT", "DATE");
    static Json = <D = unknown>() => new Type<"JSON", "non_null", D>("TEXT", "JSON");
    private is_nullable: Nullable;
    private is_primary_key: boolean;
    private default_value: string;
    constructor(private dbType: DB_Type, private convertType: TDB, opt?: {
        is_nullable?: Nullable,
        is_primary_key?: boolean
        default_value?: string
    }) {
        this.is_nullable = opt?.is_nullable ?? Nullable.Default;
        this.is_primary_key = opt?.is_primary_key ?? false;
        this.default_value = opt?.default_value ?? "";
    }
    public nullable(): Type<TDB, "null", TJson> {
        return new Type<TDB, "null", TJson>(this.dbType, this.convertType, {
            is_nullable: Nullable.Nullable,
            default_value: this.default_value,
            is_primary_key: this.is_primary_key
        });
    }
    public non_nullable(): Type<TDB, "non_null", TJson> {
        return new Type<TDB, "non_null", TJson>(this.dbType, this.convertType, {
            is_nullable: Nullable.NonNullable,
            default_value: this.default_value,
            is_primary_key: this.is_primary_key
        });
    }
    public primary_key(): this {
        this.is_primary_key = true;
        return this;
    }
    public toSQL(): string {
        let sql: string[] = [this.dbType];
        if (this.is_primary_key) {
            sql.push("PRIMARY KEY");
        }

        if (this.is_nullable !== Nullable.Default) {
            this.is_nullable === Nullable.Nullable ?
                sql.push("NULL") : sql.push("NOT NULL")
        }

        if (this.default_value) {
            sql.push(`DEFAULT (${this.default_value})`);
        }

        return sql.join(" ");
    }
    public default(value: DefaultType<TDB, TJson>): this {
        if (this.convertType === "JSON") {
            this.default_value = JSON.stringify(value);
            return this;
        }

        this.default_value = value as string;
        return this;
    }
    public convert(value: any): any {
        switch (this.convertType) {
            case "JSON":
                return JSON.stringify(value);
            default:
                return value;
        }
    }
    public parse(value: unknown): InferType<Type<TDB, TNull, TJson>> {
        switch (this.convertType) {
            case "BOOLEAN":
                return Boolean(value) as InferType<Type<TDB, TNull, TJson>>;
            case "DATE":
                return new Date(value as string) as InferType<Type<TDB, TNull, TJson>>;
            case "JSON":
                return JSON.parse(value as string) as InferType<Type<TDB, TNull, TJson>>;
            case "NULL":
            case "INTEGER":
            case "REAL":
            case "BLOB":
            case "TEXT":
                return value as InferType<Type<TDB, TNull, TJson>>;
            default:
                throw new Error("Failed to parse item");
        }
    }
}

class DBError extends Error {
    constructor(msg: string) {
        super(msg, { cause: "DB_ORM_ERROR" })
    }
}


export class Schema<T extends Record<string, Type<DB_Type_Extend, "non_null" | "null", unknown>>> {
    private init: boolean = false;
    constructor(private name: string, private table: T) {
        exists(DATABASE_FILE).then(async (exist) => {
            logger.info(`Checking database file. Status: %s`, exist ? "Exists" : "Does not Exist");
            if (!exist) {
                logger.info(`Creating database file "${DATABASE_FILE}"`);
                await writeBinaryFile(DATABASE_FILE, new Uint8Array([]));
            }

        }).catch(e => logger.error(e));
    }
    public parse(value: unknown): SchemaType<T> {
        if (typeof value !== "object" || !value) throw new Error("Failed to parse value");

        let output: PartialScheam<T> = {};

        for (const key of Object.keys(value)) {
            (output as any)[key] = this.table[key].parse((value as any)[key]);
        }

        return output as SchemaType<T>;
    }
    private async prepare() {
        const db = await SQLite.open(DATABASE_FILE);
        if (!this.init) {
            this.init = true;
            await this.createTable(db);
        }
        return db;
    }
    public async createTable(db: SQLite) {
        const fields = Object.entries(this.table).map(([key, type]) => `${key} ${type.toSQL()}`).join(", ");
        const query = `CREATE TABLE IF NOT EXISTS ${this.name} (${fields}) ;`;
        logger.debug("TABLE CREATE:", query);
        return db.execute(query);
    }
    private parseWhere(where: WhereStatment<T>, startIndex: number = 0) {
        const { values, query } = where.reduce((acc, curr, index) => {
            if ("AND" in curr || "OR" in curr) {
                const value = curr["AND"] ?? curr["OR"];
                if (!value) throw new Error("Bad WHERE query");
                const innerKey = Object.keys(value)[0];
                const innerValue = Object.values(value)[0];
                acc.query.push(`${"AND" in curr ? "AND" : "OR"} ${innerKey} = $${index + 1 + startIndex}`);
                acc.values.push(innerValue);
                return acc;
            };

            const key = Object.keys(curr)[0];
            const value = Object.values(curr)[0];
            acc.query.push(`${key} = $${index + 1 + startIndex}`);
            acc.values.push(value);
            return acc;
        }, { values: [] as any[], query: ["WHERE"] });

        return {
            params: values,
            query: query.join(" ")
        }
    }
    public async find({ where, select, order, limit }: SchemaFind<T>): Promise<Array<SchemaType<T>> | null> {
        const db = await this.prepare();

        try {
            let params: any[] = [];
            let whereBy = "";
            if (where) {
                const result = this.parseWhere(where);
                params = result.params;
                whereBy = result.query;
            }

            let orderBy = "";
            if (order) {
                const items = Object.entries(order);
                if (items.length > 1) throw new DBError("Only one order by command is required.");
                const item = items.at(0);
                if (!item) throw new DBError("Failed to get order by command");
                orderBy = `ORDER BY ${item[0]} ${item[1]}`;
            }

            const query = [
                "SELECT",
                select ? Object.keys(select).join(", ") : "*",
                "FROM",
                this.name,
                whereBy,
                orderBy,
                limit ? `LIMIT ${limit}` : ""
            ].filter(e => Boolean(e)).join(" ").trim() + ";";

            logger.debug("FIND:", query);

            const result = await db.select<unknown[]>(query, params);
            if (!result) return null;
            return result.map(value => this.parse(value));
        } catch (error) {
            if (error instanceof DBError) throw error;
            throw new DBError((error as Error)?.message ?? "Unkown Error");
        } finally {
            await db.close();
        }
    }
    public async create({ data }: { data: SchemaType<T> }): Promise<boolean> {
        const db = await this.prepare();
        try {
            const { values, cols, params } = Object.entries(data).reduce((acc, [key, value], idx) => {
                acc.cols.push(key);
                acc.values.push(`$${idx + 1}`)
                acc.params.push(value);

                return acc;

            }, { params: [] as unknown[], values: [] as string[], cols: [] as string[] });

            const query = `INSERT INTO ${this.name} (${cols.join(", ")}) VALUES (${values.join(", ")});`;

            logger.debug("INSERT:", query);

            const exec = await db.execute(query, params);

            return exec;
        } catch (error) {
            if (error instanceof DBError) throw error;

            throw new DBError((error as Error)?.message ?? "Unkown Error");
        } finally {
            await db.close();
        }
    }
    public async update({ data, where }: ScheamUpdate<T>): Promise<boolean> {
        const db = await this.prepare();
        try {
            let { params, values, } = Object.entries(data).reduce((acc, [key, value], idx) => {
                acc.params.push(this.table[key].convert(value));
                acc.values.push(`${key} = $${idx + 1}`)
                return acc;
            }, { params: [] as unknown[], values: [] as string[] });


            let whereBy = "";
            if (where) {
                const result = this.parseWhere(where, params.length);
                params = [...params, ...result.params];
                whereBy = result.query;
            }

            const query = [
                "UPDATE",
                this.name,
                "SET",
                values.join(", "),
                whereBy
            ].filter(e => Boolean(e)).join(" ").trim() + ";";

            logger.debug(query);

            const result = await db.execute(query, params);
            return result;
        } catch (error) {
            if (error instanceof DBError) throw error;
            throw new DBError((error as Error)?.message ?? "Unkown Error");
        } finally {
            await db.close();
        }
    }
    public async delete({ where }: SchemaDelete<T>): Promise<boolean> {
        const db = await this.prepare();
        try {
            const { params, query } = this.parseWhere(where);

            const deleteQuery = [
                "DELETE",
                "FROM",
                this.name,
                query
            ].filter(e => Boolean(e)).join(" ").trim() + ";";

            logger.debug(deleteQuery);
            const result = await db.execute(deleteQuery, params);
            return result;
        } catch (error) {
            if (error instanceof DBError) throw error;
            throw new DBError((error as Error)?.message ?? "Unkown Error");
        } finally {
            await db.close();
        }
    }
}





