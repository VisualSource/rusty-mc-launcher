// -Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M

export default class JVMArgs {
    public maxMemory = 2;
    public values: string[] = [];
    constructor(args: string) {
        const splitedArgs = args.split(" ");
        const xmsIndex = splitedArgs.findIndex(e => e.startsWith("-Xms"));
        const xmxIndex = splitedArgs.findIndex(e => e.startsWith("-Xmx"));

        if (xmsIndex !== -1) {
            const arg = splitedArgs.splice(xmsIndex, 1).at(0);
            if (arg) {
                const target = arg.match(/-Xms(?<value>\d+)(?<size>[KMGkmg])/g);
                if (target?.groups) {
                    this.minMemory = Number.parseInt(target.groups.value);
                    this.minMemorySize = target.groups.value.toUpperCase() as MemorySize;
                }
            }
        };
        if (xmxIndex !== -1) {
            const arg = splitedArgs.splice(xmxIndex, 1).at(0);
            if (arg) {
                const target = arg.match(/-Xmx(?<value>\d+)(?<size>[KMGkmg])/g);
                if (target?.groups) {
                    this.maxMemory = Number.parseInt(target.groups.value);
                    this.maxMemorySize = target.groups.value.toUpperCase() as MemorySize;
                }
            }
        }

        this.values = splitedArgs;
    }

    public setMaxMemoryValue(value: number) {
        this.maxMemory = value;
        return this;
    }
    public removeKey(key: string) {
        const index = this.values.indexOf(key);

        this.values.splice(index, 1);

        return this;
    }
    public setKey(key: string, value?: string): this {
        this.values[key] = value;
        return this;
    }

    public toString(): string {
        const output = [`-Xmx${this.maxMemory}${this.maxMemorySize}`];

        if (this.minMemory) {
            output.push(`-Xms${this.minMemory}${this.minMemorySize}`);
        }

        for (const [key, value] of Object.entries(this.values)) {
            if (!value) {
                output.push(key);
                continue;
            }
            output.push(`${key}=${value}`);
        }

        return output.join(" ");
    }
}