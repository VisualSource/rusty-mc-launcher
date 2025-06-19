import { formatSize } from "./size_format";
import { expect, test, describe } from "vitest";

describe("sizeFormat", () => {
	test("IEC Format 1024 Bytes", () => {
		expect(formatSize(1024, { mode: "iec" })).toBe("1KiB");
	});

	test("SI Format 1000 Bytes", () => {
		expect(formatSize(1000)).toBe("1kB");
	});

	test("IEC Format 512 bytes", () => {
		expect(formatSize(512, { byte: "B", mode: "iec" })).toBe("512B");
	});

	test("IEC Format 1280 bytes with 1 digit and space units", () => {
		expect(formatSize(1280, { digit: 1, space: true, mode: "iec" })).toBe(
			"1.3 KiB",
		);
	});

	test("IEC Format 1YiB", () => {
		expect(formatSize(1208925819614629174706176n, { mode: "iec" })).toBe("1YiB");
	});

	test("IEC Format 1YiB", () => {
		expect(formatSize(BigInt(1208925819614629174706176), { mode: "iec" })).toBe(
			"1YiB",
		);
	});

	test("Text Range Error", () => {
		expect(() => formatSize(-1, { mode: "iec" })).toThrowError();
	});

	test("Text Range Error 2", () => {
		expect(() =>
			formatSize(1208925819614629174706176, { mode: "iec" }),
		).toThrowError();
	});
});