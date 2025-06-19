import { expect, test, describe } from "vitest";
import { parseJVMArgs, argsToString } from "./JvmArgs";

const TEST_ARGS = "-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M";

describe("JVM args parser", () => {
    test("parseJVMArgs()", () => {
        expect(parseJVMArgs(TEST_ARGS)).toMatchObject({
            memory: [2],
            args: [
                "-XX:+UnlockExperimentalVMOptions",
                "-XX:+UseG1GC",
                "-XX:G1NewSizePercent=20",
                "-XX:G1ReservePercent=20",
                "-XX:MaxGCPauseMillis=50",
                "-XX:G1HeapRegionSize=32M"
            ]
        })
    });

    test("argsToString()", () => {

        expect(argsToString({
            memory: [2],
            args: [
                "-XX:+UnlockExperimentalVMOptions",
                "-XX:+UseG1GC",
                "-XX:G1NewSizePercent=20",
                "-XX:G1ReservePercent=20",
                "-XX:MaxGCPauseMillis=50",
                "-XX:G1HeapRegionSize=32M"
            ]

        })).toBe(TEST_ARGS)
    });
});
