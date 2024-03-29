export const wait = (ms: number) =>
  new Promise<void>((ok) => setTimeout(() => ok(), ms));
