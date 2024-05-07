import { expect, test } from "vitest";
import { parseLastVersionId } from './parseLastVersionId';


test("Parse Minecraft Fabric Version string", () => {
    const version = "fabric-loader-0.14.21-1.20";
    const result = parseLastVersionId(version)

    expect(result).toMatchObject({
        loader: "fabric",
        loader_version: "0.14.21",
        game_version: "1.20"
    });
});

test("Parse Minecraft Forge Version string", () => {
    const version = "1.19.4-forge-45.1.0";
    const result = parseLastVersionId(version)

    expect(result).toMatchObject({
        loader: "forge",
        loader_version: "45.1.0",
        game_version: "1.19.4"
    });
});


test("Parse Minecraft Version string", () => {
    const version = "1.20.1";
    const result = parseLastVersionId(version)

    expect(result).toMatchObject({
        loader: "vanila",
        loader_version: null,
        game_version: "1.20.1"
    });
});

test("Parse Minecraft snapshot string", () => {
    const version = "1.20-pre4";
    const result = parseLastVersionId(version)

    expect(result).toMatchObject({
        loader: "vanila",
        loader_version: null,
        game_version: "1.20-pre4"
    });
});