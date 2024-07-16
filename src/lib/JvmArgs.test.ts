import { expect, test, describe } from "vitest";
import JVMArgs, { convertTo } from "./JvmArgs";

const TEST_ARGS = "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M";
const EMPTY_STR = "";

describe("JVMAArg convertTo", () => {
    test("KB to KB", () => {
        expect(convertTo(1, "K", "K")).toBe(1);
    });
    test("KB to MB", () => {
        expect(convertTo(1, "K", "M")).toBe(0.001);
    });
    test("KB to GB", () => {
        expect(convertTo(1, "K", "G")).toBe(0.000001);
    });

    test("MB to KB", () => {
        expect(convertTo(1, "M", "K")).toBe(1000);
    });
    test("MB to MB", () => {
        expect(convertTo(1, "M", "M")).toBe(1);
    });
    test("MB to GB", () => {
        expect(convertTo(1, "M", "G")).toBe(0.001);
    });

    test("GB to KB", () => {
        expect(convertTo(1, "G", "K")).toBe(1_000_000);
    });
    test("GB to MB", () => {
        expect(convertTo(1, "G", "M")).toBe(1000);
    });
    test("BG to GB", () => {
        expect(convertTo(1, "G", "G")).toBe(1);
    });
});

describe("JVMArgs Class", () => {

    test("Parseing of args string", () => {
        const args = new JVMArgs(TEST_ARGS);
        expect(args.values).have.property("-XX:G1NewSizePercent", "20");
        expect(args.values).have.property("-XX:G1ReservePercent", "20");
        expect(args.values).have.property("-XX:MaxGCPauseMillis", "50");
        expect(args.values).have.property("-XX:G1HeapRegionSize", "32M");
        expect(args.values).have.property("-XX:+UseG1GC", undefined);
        expect(args.values).have.property("-XX:+UnlockExperimentalVMOptions", undefined);
        expect(args.maxMemory).toBe(2);
        expect(args.maxMemorySize).toBe("G");
        expect(args.minMemory).toBe(null);
        expect(args.minMemorySize).toBe("M");
    });

    test("setKey() Double", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setKey("-XX:G1HeapRegionSize", "32M");

        expect(args.values).have.property("-XX:G1HeapRegionSize", "32M");
    });

    test("removeKey() Double", () => {
        const args = new JVMArgs("-XX:G1HeapRegionSize=32M");

        args.removeKey("-XX:G1HeapRegionSize")

        expect(args.values).not.have.property("-XX:G1HeapRegionSize", "32M");
    });

    test("setKey() Single", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setKey("-XX:+UseG1GC");

        expect(args.values).have.property("-XX:+UseG1GC", undefined);
    });

    test("removeKey() Single", () => {
        const args = new JVMArgs("-XX:+UseG1GC");

        args.removeKey("-XX:+UseG1GC")

        expect(args.values).not.have.property("-XX:+UseG1GC", undefined);
    });

    test("setKey() Update", () => {
        const args = new JVMArgs("-XX:G1HeapRegionSize=32M");

        args.setKey("-XX:G1HeapRegionSize", "44M");

        expect(args.values).have.property("-XX:G1HeapRegionSize", "44M");
    });

    test("setMinMemorySize()", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setMinMemorySize("K");

        expect(args.minMemorySize).toBe("K");
    });
    test("setMinMemorySize() Update", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.minMemory = 15; // 15MB
        args.minMemorySize = "M";

        args.setMinMemorySize("K");

        expect(args.minMemorySize).toBe("K");
        expect(args.minMemory).toBe(15_000);
    });

    test("setMaxMemorySize()", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setMaxMemorySize("M");

        expect(args.maxMemorySize).toBe("M");
        expect(args.maxMemory).toBe(2000);
    });

    test("setMaxMemoryValue()", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setMaxMemoryValue(3);

        expect(args.maxMemory).toBe(3);
    });

    test("setMaxMemoryValue() Error", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.minMemory = 4;
        args.minMemorySize = "G"

        expect(() => {
            args.setMaxMemoryValue(1);
        }).toThrow();
    });

    test("setMinMemoryValue()", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.setMinMemoryValue(512);

        expect(args.minMemory).toBe(512);

    });
    test("setMinMemoryValue() Error", () => {
        const args = new JVMArgs(EMPTY_STR);
        args.minMemorySize = "G";
        expect(() => {
            args.setMinMemoryValue(4);
        }).toThrow()
    });

    test("toggleMinMemory() On", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.toggleMinMemory();

        expect(args.minMemory).toBe(256);
        expect(args.minMemorySize).toBe("M");
    });

    test("toggleMinMemory() Off", () => {
        const args = new JVMArgs(EMPTY_STR);

        args.minMemory = 400;

        args.toggleMinMemory();

        expect(args.minMemory).toBe(null);
    });


    test("toString", () => {
        const TARGET = "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20";
        const args = new JVMArgs(TARGET);
        expect(args.toString()).toBe(TARGET);
    });
});