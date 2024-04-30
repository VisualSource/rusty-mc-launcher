import { z } from "zod";

const CONFIG = {
    "si": {
        BASE: 1000,
        UNIT_TABLE: { 1: "Byte", 2: 'kB', 3: 'MB', 4: 'GB', 5: 'TB', 6: 'PB', 7: 'EB', 8: 'ZB', 9: 'YB' }
    },
    "iec": {
        BASE: 1024,
        UNIT_TABLE: { 1: "Byte", 2: 'KiB', 3: 'MiB', 4: 'GiB', 5: 'TiB', 6: 'PiB', 7: 'EiB', 8: 'ZiB', 9: 'YiB' }
    }
}

const sizeOptions = z.object({
    mode: z.enum(["iec", "si"]).optional().default("si"),
    space: z.boolean().optional().default(false),
    byte: z.string().optional().default("byte"),
    digit: z.number().gte(0, "`digits` must be an integer greater than or equal to 0.").optional().default(0)
})

const numCheck = z.number().gte(0).positive().finite().refine(arg => Number.isSafeInteger(arg), `\`BigInt\` should be used when specifying huge numbers (Value greater than ${Number.MAX_SAFE_INTEGER}).`);
const bigintCheck = z.bigint().gte(BigInt(0), 'The file size must be a number greater than or equal to 0.')

type SizeOptions = Partial<z.infer<typeof sizeOptions>>;

export function formatSize(size: number | BigInt, options?: SizeOptions): string {
    const optionsInited = sizeOptions.parse(options ?? {});

    CONFIG[optionsInited.mode].UNIT_TABLE["1"] = optionsInited.byte;
    const base = CONFIG[optionsInited.mode].BASE;
    const space = options?.space ? ' ' : '';
    if (typeof size === "number") {
        const value = numCheck.parse(size);
        const chusu = 10 ** optionsInited.digit;
        for (const [exponentStr, unit] of Object.entries(CONFIG[optionsInited.mode].UNIT_TABLE)) {
            const exponent = Number(exponentStr);
            if (value < base ** exponent) {
                return `${Math.round((size / base ** (exponent - 1)) * chusu) / chusu}${space}${unit}`;
            }
        }

        return "";
    }
    const biBase = BigInt(base);
    const value = bigintCheck.parse(size);

    for (const [exponentStr, unit] of Object.entries(CONFIG[optionsInited.mode].UNIT_TABLE)) {
        const exponent = BigInt(exponentStr);
        if (value < biBase ** exponent) {
            const denominator = biBase ** (exponent - 1n);
            return `${(value + denominator / 2n) / denominator}${space}${unit}`;
        }
    }

    const exponents = Object.keys(CONFIG[optionsInited.mode].UNIT_TABLE);
    const units = Object.values(CONFIG[optionsInited.mode].UNIT_TABLE);
    return `${value / biBase ** (BigInt(exponents.at(-1) ?? 0) - 1n)}${space}${units.at(-1)}`
}


