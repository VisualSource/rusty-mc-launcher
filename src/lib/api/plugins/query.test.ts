import { expect, test, describe, afterEach, beforeEach } from "vitest";
import { mockIPC, clearMocks } from "@tauri-apps/api/mocks";
import { query, type QueryResult } from "./query";

// Window object is required for testing ipc.
// this function below is a modified version of the one in tauri mocks module
// with a check to init the window object. Current version (2.0.0-RC.?) does not do this
// and has test fail
function ensureMockInternals() {
    if (!globalThis?.window) {
        //@ts-ignore -- mockIPC does not create window object in node env.
        globalThis.window = {};
    }
    let _a;
    (window as Window & typeof globalThis & { __TAURI_INTERNALS__: {} }).__TAURI_INTERNALS__ = (_a = (window as Window & typeof globalThis & { __TAURI_INTERNALS__: {} }).__TAURI_INTERNALS__) !== null && _a !== void 0 ? _a : {};
}

class ExampleClass {
    public a: string;
    public b: string;
    constructor(args: QueryResult) {
        this.a = args.a as string;
        this.b = args.b as string;
    }
}

afterEach(() => {
    clearMocks();
});

beforeEach(() => {
    ensureMockInternals();
});

describe("Query Plugin", () => {
    test("query.all()", async () => {
        //@ts-ignore
        mockIPC((cmd, args) => {
            if (cmd === "plugin:rmcl-query|select") {
                return [{ row: "A", d: "B" }];
            }
            return []
        });

        const stmt = query<{}>("SELECT * FROM table WHERE id = ?", [4]);

        const value = await stmt.all();

        expect(value).toStrictEqual([{ row: "A", d: "B" }]);
    });

    test("query.get()", async () => {
        //@ts-ignore
        mockIPC((cmd, args) => {
            if (cmd === "plugin:rmcl-query|select") {
                return [{ row: "A", d: "B" }];
            }
            return []
        });

        const stmt = query<{ row: string, d: string }>("SELECT * FROM table WHERE id = ?", [4]);

        const value = await stmt.get();

        expect(value).toStrictEqual({ row: "A", d: "B" });
    });

    test("query.run()", async () => {
        //@ts-ignore
        mockIPC((cmd, args) => {
            if (cmd === "plugin:rmcl-query|execute") {
                return [0, 0]
            }
            return null;
        });

        const stmt = query<void>("SELECT * FROM table WHERE id = ?", [4]);

        const value = await stmt.run();

        expect(value).toStrictEqual([0, 0]);
    });

    test("query.as.all()", async () => {
        //@ts-ignore
        mockIPC((cmd, args) => {
            if (cmd === "plugin:rmcl-query|select") {
                return [{ a: "c", b: "d" }];
            }
            return []
        });

        const stmt = query("SELECT * FROM table WHERE id = ?", [4]).as(ExampleClass);

        const value = await stmt.all();

        expect(value).toStrictEqual([new ExampleClass({ a: "c", b: "d" })]);
    });

    test("query.as.get()", async () => {
        //@ts-ignore
        mockIPC((cmd, args) => {
            if (cmd === "plugin:rmcl-query|select") {
                return [{ a: "c", b: "d" }];
            }
            return []
        });

        const stmt = query("SELECT * FROM table WHERE id = ?", [4]).as(ExampleClass);

        const value = await stmt.get();

        expect(value).toStrictEqual(new ExampleClass({ a: "c", b: "d" }));
    });
});