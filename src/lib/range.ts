export const range = (start: number, end: number, step: number = 1) => {
  return Array(end - start + 1)
    .fill(0)
    .map((_, idx) => start + idx * step);
};
