import logger from "@system/logger";
import DB from "./db";

type DB_Type = "NULL" | "INTEGER" | "REAL" | "TEXT" | "BLOB";
type DB_Type_Extend =
  | "NULL"
  | "INTEGER"
  | "REAL"
  | "TEXT"
  | "BLOB"
  | "DATE"
  | "JSON"
  | "BOOLEAN"
  | "ENUM";
type DefaultType<T extends DB_Type_Extend, J = unknown> = T extends "ENUM"
  ? J
  : never | T extends "INTEGER"
  ? J
  : never | T extends "DATE"
  ? "CURRENT_TIMESTAMP" | "CURRENT_DATE" | "CURRENT_TIME"
  : never | T extends "JSON"
  ? J
  : never | T extends "BOOLEAN"
  ? "TRUE" | "FALSE"
  : never;

type InferType<T> = T extends Type<infer R, infer N, infer J>
  ?
  | (R extends "JSON" ? J : never)
  | (R extends "ENUM" ? J : never)
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
type PartialScheam<P> = Partial<SchemaType<P>>;
type WhereStatment<P> = [
  PartialScheam<P>,
  ...Array<{
    AND?: PartialScheam<P>;
    OR?: PartialScheam<P>;
  }>,
];
type SchemaFind<P> = {
  distinct?: boolean;
  where?: WhereStatment<P>;
  select?: Partial<Record<keyof P, true>>;
  order?: Partial<Record<keyof P, "ASC" | "DESC">>;
  limit?: number;
};
type ScheamUpdate<P> = {
  data: PartialScheam<P>;
  where?: WhereStatment<P>;
};
type SchemaDelete<P> = {
  where: WhereStatment<P>;
};

export type InferSchema<P> = P extends Schema<infer S> ? SchemaType<S> : never;

const enum Nullable {
  Default,
  Nullable,
  NonNullable,
}

export class Type<
  TDB extends DB_Type_Extend,
  TNull extends "non_null" | "null" = "non_null",
  TJson = unknown,
> {
  static Integer = () => new Type("INTEGER", "INTEGER");
  static Boolean = () => new Type("INTEGER", "BOOLEAN");
  static Real = () => new Type("REAL", "REAL");
  static Text = () => new Type("TEXT", "TEXT");
  static Blob = () => new Type("BLOB", "BLOB");
  static Date = () => new Type("TEXT", "DATE");
  static Enum = <D extends string>() =>
    new Type<"ENUM", "non_null", D>("TEXT", "ENUM");
  static Json = <D = unknown>() =>
    new Type<"JSON", "non_null", D>("TEXT", "JSON");
  private is_nullable: Nullable;
  private is_primary_key: boolean;
  private default_value: string;
  private autoincrement: boolean;
  constructor(
    private dbType: DB_Type,
    private convertType: TDB,
    opt?: {
      is_nullable?: Nullable;
      is_primary_key?: boolean;
      default_value?: string;
      autoincrement?: boolean;
    },
  ) {
    this.autoincrement = opt?.autoincrement ?? false;
    this.is_nullable = opt?.is_nullable ?? Nullable.Default;
    this.is_primary_key = opt?.is_primary_key ?? false;
    this.default_value = opt?.default_value ?? "";
  }
  public nullable(): Type<TDB, "null", TJson> {
    return new Type<TDB, "null", TJson>(this.dbType, this.convertType, {
      is_nullable: Nullable.Nullable,
      default_value: this.default_value,
      is_primary_key: this.is_primary_key,
    });
  }
  public non_nullable(): Type<TDB, "non_null", TJson> {
    return new Type<TDB, "non_null", TJson>(this.dbType, this.convertType, {
      is_nullable: Nullable.NonNullable,
      default_value: this.default_value,
      is_primary_key: this.is_primary_key,
    });
  }

  public auto_increment(): this {
    if (this.dbType !== "INTEGER")
      throw new DBError("Can not have autoincrement on non integer type");
    this.autoincrement = true;
    return this;
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

    if (this.autoincrement) {
      sql.push("AUTOINCREMENT");
    }

    if (this.is_nullable !== Nullable.Default) {
      this.is_nullable === Nullable.Nullable
        ? sql.push("NULL")
        : sql.push("NOT NULL");
    }

    if (this.default_value) {
      sql.push(`DEFAULT (${this.default_value})`);
    }

    return sql.join(" ");
  }
  public default(value: DefaultType<TDB, TJson>): this {
    switch (this.convertType) {
      case "INTEGER":
        this.default_value = (value as number).toString();
        break;
      case "JSON":
        this.default_value = JSON.stringify(value);
        break;
      default:
        this.default_value = `'${value}'` as string;
        break;
    }

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
        return JSON.parse(value as string) as InferType<
          Type<TDB, TNull, TJson>
        >;
      case "NULL":
      case "INTEGER":
      case "REAL":
      case "BLOB":
      case "ENUM":
      case "TEXT":
        return value as InferType<Type<TDB, TNull, TJson>>;
      default:
        throw new Error("Failed to parse item");
    }
  }
}
class DBError extends Error {
  constructor(msg: string) {
    super(msg, { cause: "DB_ORM_ERROR" });
  }
}
export class Schema<
  T extends Record<string, Type<DB_Type_Extend, "non_null" | "null", unknown>>,
> {
  private init: boolean = false;
  private updated: boolean = false;
  constructor(
    public name: string,
    private table: T,
    private opts: {
      forign?: Record<string, { table: string; column: string }>;
      runAfterCreate?: string;
    } = {},
  ) { }

  public parse(value: unknown): SchemaType<T> {
    if (typeof value !== "object" || !value)
      throw new Error("Failed to parse value");

    let output: PartialScheam<T> = {};

    for (const key of Object.keys(value)) {
      (output as any)[key] = this.table[key].parse((value as any)[key]);
    }

    return output as SchemaType<T>;
  }
  public async prepare() {
    const db = DB.use();

    if (!this.init) {
      this.init = true;
      const fields = Object.entries(this.table)
        .map(([key, type]) => `${key} ${type.toSQL()}`)
        .join(", ");

      let foreignKeys;
      if (this.opts?.forign) {
        foreignKeys = Object.entries(this.opts?.forign)
          .map(
            ([key, value]) =>
              `FOREIGN KEY(${key}) REFERENCES ${value.table}(${value.column})`,
          )
          .join(",");
      }

      const query = `CREATE TABLE IF NOT EXISTS ${this.name} (${fields}${foreignKeys ? "," + foreignKeys : ""
        });`;
      logger.debug(query);
      await db.execute(query);
      if (this.opts?.runAfterCreate) {
        try {
          await db.execute(this.opts.runAfterCreate);
        } catch (error) { }
      }
    } else {
      if (!this.updated) {
        const currentColumns = (await db.select(
          `PRAGMA table_info(${this.name})`,
        )) as { cid: number; name: string }[];

        logger.debug("ListedColumns", currentColumns);

        const missingColumns = Object.keys(this.table).filter(
          (value) =>
            currentColumns.findIndex((item) => item.name === value) === -1,
        );

        logger.debug("Missing Columns", missingColumns);

        for (const col of missingColumns) {
          const addOrRemove = !!this.table[col];

          const query = addOrRemove
            ? `ALTER TABLE ${this.name} ADD COLUMN ${col} ${this.table[
              col
            ].toSQL()}`
            : `ALTER TABLE ${this.name} DROP COLUMN ${col}`;
          logger.debug(query);
          const ok = await db.execute(query);
          if (ok) {
            logger.info(`${addOrRemove ? "Added" : "Droped"} column ${col}`);
          } else {
            logger.info(`Failed to update column (${col})`);
          }
        }

        this.updated = true;
      }
    }
    return db;
  }
  private parseWhere(where: WhereStatment<T>, startIndex: number = 0) {
    const { values, query } = where.reduce(
      (acc, curr, index) => {
        if ("AND" in curr || "OR" in curr) {
          const value = curr["AND"] ?? curr["OR"];
          if (!value) throw new Error("Bad WHERE query");
          const innerKey = Object.keys(value)[0];
          const innerValue = Object.values(value)[0];
          acc.query.push(
            `${"AND" in curr ? "AND" : "OR"} ${innerKey} = $${index + 1 + startIndex
            }`,
          );
          acc.values.push(innerValue);
          return acc;
        }

        const key = Object.keys(curr)[0];
        const value = Object.values(curr)[0];
        acc.query.push(`${key} = $${index + 1 + startIndex}`);
        acc.values.push(value);
        return acc;
      },
      { values: [] as unknown[], query: ["WHERE"] },
    );

    return {
      params: values,
      query: query.join(" "),
    };
  }

  public async execute<D>(sql: string, values?: unknown[], parse: boolean = false) {
    const db = await this.prepare();
    try {
      const result = await db.select<D[]>(
        sql.replace("%table%", this.name),
        values,
      );
      if (!result) return null;

      if (parse) {
        return result.map(value => this.parse(value));
      }
      return result;
    } catch (error) {
      logger.error(error);
      if (error instanceof DBError) throw error;
      const dbError = new DBError((error as Error)?.message ?? "Unknown Error");
      dbError.stack = (error as Error).stack;
      throw dbError;
    }
  }

  public async find({
    where,
    select,
    order,
    limit,
    distinct,
  }: SchemaFind<T>): Promise<Array<SchemaType<T>> | null> {
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
        if (items.length > 1)
          throw new DBError("Only one order by command is required.");
        const item = items.at(0);
        if (!item) throw new DBError("Failed to get order by command");
        orderBy = `ORDER BY ${item[0]} ${item[1]}`;
      }

      const query =
        [
          "SELECT",
          distinct ? "DISTINCT" : undefined,
          select ? Object.keys(select).join(", ") : "*",
          "FROM",
          this.name,
          whereBy,
          orderBy,
          limit ? `LIMIT ${limit}` : "",
        ]
          .filter((e) => Boolean(e))
          .join(" ")
          .trim() + ";";

      logger.debug(`FIND: ${query}`);

      const result = await db.select<unknown[]>(query, params);
      if (!result) return null;
      return result.map((value) => this.parse(value));
    } catch (error) {
      if (error instanceof DBError) throw error;
      const dbError = new DBError((error as Error)?.message ?? "Unknown Error");
      dbError.stack = (error as Error).stack;
      throw dbError;
    }
  }
  public async create({ data }: { data: SchemaType<T> }): Promise<boolean> {
    const db = await this.prepare();
    try {
      const { values, cols, params } = Object.entries(data).reduce(
        (acc, [key, value], idx) => {
          acc.cols.push(key);
          acc.values.push(`$${idx + 1}`);
          acc.params.push(value);

          return acc;
        },
        {
          params: [] as unknown[],
          values: [] as string[],
          cols: [] as string[],
        },
      );

      const query = `INSERT INTO ${this.name} (${cols.join(
        ", ",
      )}) VALUES (${values.join(", ")});`;

      logger.debug(query);

      const exec = await db.execute(query, params);

      return exec;
    } catch (error) {
      if (error instanceof DBError) throw error;

      throw new DBError((error as Error)?.message ?? "Unkown Error");
    }
  }
  public async update({ data, where }: ScheamUpdate<T>): Promise<boolean> {
    const db = await this.prepare();
    try {
      let { params, values } = Object.entries(data).reduce(
        (acc, [key, value], idx) => {
          acc.params.push(this.table[key].convert(value));
          acc.values.push(`${key} = $${idx + 1}`);
          return acc;
        },
        { params: [] as unknown[], values: [] as string[] },
      );

      let whereBy = "";
      if (where) {
        const result = this.parseWhere(where, params.length);
        params = [...params, ...result.params];
        whereBy = result.query;
      }
      const query =
        ["UPDATE", this.name, "SET", values.join(", "), whereBy]
          .filter((e) => Boolean(e))
          .join(" ")
          .trim() + ";";
      logger.debug(query);
      logger.debug(params);

      const result = await db.execute(query, params);
      return result;
    } catch (error) {
      if (error instanceof DBError) throw error;
      logger.error(error);
      throw new DBError((error as Error)?.message ?? "Unkown Error");
    }
  }
  public async delete({ where }: SchemaDelete<T>): Promise<boolean> {
    const db = await this.prepare();
    try {
      const { params, query } = this.parseWhere(where);

      const deleteQuery =
        ["DELETE", "FROM", this.name, query]
          .filter((e) => Boolean(e))
          .join(" ")
          .trim() + ";";

      logger.debug(deleteQuery);

      const result = await db.execute(deleteQuery, params);
      return result;
    } catch (error) {
      if (error instanceof DBError) throw error;
      throw new DBError((error as Error)?.message ?? "Unkown Error");
    }
  }
  public async findOne(
    props: Omit<SchemaFind<T>, "limit">,
  ): Promise<SchemaType<T> | null> {
    const item = await this.find({ ...props, limit: 1 });
    if (!item) return null;
    return item.at(0) ?? null;
  }
}
