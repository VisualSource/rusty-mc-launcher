// -Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M
export function parseJVMArgs(value: string | undefined | null) {
	if (!value) return { memory: [2], args: [] };

	const splitedArgs = value.split(" ");
	const xmxIndex = splitedArgs.findIndex((e) => e.startsWith("-Xmx"));

	let memory = 2;
	if (xmxIndex !== -1) {
		const arg = splitedArgs.splice(xmxIndex, 1).at(0);
		if (arg) {
			const target = arg.match(/-Xmx(?<value>\d+)(?<size>[KMGkmg])/);
			if (target?.groups) {
				memory = Number.parseInt(target.groups.value);
			}
		}
	}

	return { memory: [memory], args: splitedArgs };
}

export function argsToString(value: { memory: number[]; args: string[] }) {
	const output = [`-Xmx${value.memory[0]}G`, ...value.args];
	return output.join(" ");
}
