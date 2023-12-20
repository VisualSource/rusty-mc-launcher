export const getSetFirst = <T = unknown>(set: Set<T>) => {
  const result = set.values().next();
  if (result?.done) return null;
};
