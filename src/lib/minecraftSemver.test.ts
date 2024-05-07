import { expect, test } from "vitest";
import { MinecraftSemver } from './minecraftSemver';


test("Parse minecraft release", () => {
    const result = MinecraftSemver.parse("1.20.6");

    expect(result).toMatchObject({
        type: "release",
        major: 1,
        minor: 20,
        patch: 6,
        rc: null,
        pre: null
    });
});

test("Parse minecraft release", () => {
    const result = MinecraftSemver.parse("1.20");

    expect(result).toMatchObject({
        type: "release",
        major: 1,
        minor: 20,
        patch: 0,
        rc: null,
        pre: null
    });
});

test("Parse minecraft rc", () => {
    const result = MinecraftSemver.parse("1.20.6-rc1");

    expect(result).toMatchObject({
        type: "release",
        major: 1,
        minor: 20,
        patch: 6,
        rc: 1,
        pre: null
    });
});

test("Parse minecraft prerelease", () => {
    const result = MinecraftSemver.parse("1.20.5-pre4");

    expect(result).toMatchObject({
        type: "release",
        major: 1,
        minor: 20,
        patch: 5,
        rc: null,
        pre: 4
    });
});

test("Parse minecraft snapshot", () => {
    const result = MinecraftSemver.parse("23w13a");

    expect(result).toMatchObject({
        type: "snapshot",
        year: 23,
        week: 13,
        identifier: "a"
    });
});
test("Parse minecraft snapshot joke", () => {
    const result = MinecraftSemver.parse("23w13a_or_b");

    expect(result).toMatchObject({
        type: "snapshot",
        year: 23,
        week: 13,
        identifier: "a_or_b"
    });
});


test("1.20.6 > 1.20", () => {
    expect(MinecraftSemver.gt("1.20.6", "1.20")).toBe(true);
});

test("1.20 > 1.20.6", () => {
    expect(MinecraftSemver.gt("1.20", "1.20.6")).toBe(false);
});

test("1.20.6 > 1.20.6-rc1", () => {
    expect(MinecraftSemver.gt("1.20.6", "1.20.6-rc1")).toBe(true)
});

test("1.20.6 > 1.20.6-pre4", () => {
    expect(MinecraftSemver.gt("1.20.6", "1.20.6-pre4")).toBe(true)
});

test("1.20.6-rc1 > 1.20.6-pre4", () => {
    expect(MinecraftSemver.gt("1.20.6-rc1", "1.20.6-pre4")).toBe(true)
});

test("1.20.6-rc2 > 1.20.6-rc1", () => {
    expect(MinecraftSemver.gt("1.20.6-rc2", "1.20.6-rc1")).toBe(true)
});

test("1.20.6-pre4 > 1.20.6-pre3", () => {
    expect(MinecraftSemver.gt("1.20.6-pre4", "1.20.6-pre3")).toBe(true)
});

test("24w14b > 24w14a", () => {
    expect(MinecraftSemver.gt("24w14b", "24w14a")).toBe(true)
});

test("24w14a > 24w14b", () => {
    expect(MinecraftSemver.gt("24w14a", "24w14b")).toBe(false)
});


test("23w13a_or_b > 24w14potato", () => {
    expect(MinecraftSemver.gt("23w13a_or_b", "24w14potato")).toBe(false)
});
