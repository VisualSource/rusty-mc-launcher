import { getSystemRam } from "@/lib/api/plugins/content";
import { MarkedSlider } from "./slider";
import { use, useState } from "react";
import { range } from "@/lib/range";
import { cn } from "@/lib/utils";

let memoryCache: Promise<{ min: number; max: number; ticks: number[] }> | undefined;
const getMemory = () => {
    memoryCache = memoryCache ? memoryCache : getSystemRam().then((ram) => {
        let max = ram;
        if (ram >= 32) {
            max = 32;
        }
        return { min: 2, max: max - 5, ticks: range(2, max - 5, 1) };
    });

    return memoryCache;
}

export const MemorySlider: React.FC<{
    name?: string;
    value: number;
    onChange: (value: number) => void;
}> = ({ name, value, onChange }) => {
    const { min, max, ticks } = use(getMemory());
    const [state, setState] = useState([value]);

    return (
        <div className="grow items-center w-full my-2">
            <MarkedSlider
                name={name}
                onValueCommit={(value) => onChange(value[0])}
                onValueChange={setState}
                value={state}
                min={min}
                max={max}
                step={1}
            />
            <div className="mt-1.5 flex flex-row relative w-full">
                {ticks.map((v) => (
                    <span
                        key={`maxMemory-${v}`}
                        style={{ width: `${100 / ticks.length}%`, maxWidth: "none" }}
                        className={cn("text-sm font-light text-center", {
                            "text-10 opacity-40 select-none touch-none":
                                v >= 0 && v <= max,
                        })}
                        role="presentation"
                    >
                        {v % 2 === 0 ? v : "|"}
                    </span>
                ))}
            </div>
        </div>
    );
}