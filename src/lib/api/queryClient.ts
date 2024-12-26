import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

export function invalidateQueries(keys: string[][]) {
    return Promise.all(keys.map(ke => queryClient.invalidateQueries({ queryKey: ke })));
}