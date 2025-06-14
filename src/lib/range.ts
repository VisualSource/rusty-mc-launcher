export const range = (start: number, end: number, step = 1) => {
	return Array.from(rangeIter(start, end, step))
};


export function* rangeIter(start: number, end: number, step = 1) {
	let i = start;
	while (i <= end) {
		yield i;
		i += step;
	}
	return end;
}