import { useQuery } from "@tanstack/react-query"

const LOADER_VERISON = "https://meta.fabricmc.net/v2/versions/loader";

export type FabricLoaderVersion = {
    separator: string;
    build: number;
    maven: string;
    version: string;
    stable: boolean
}

export const useFabricLoaderVersions = () => {
    return useQuery({
        queryKey: ["minecraft", "fabric-loader", "versions"],
        queryFn: async () => {
            const response = await fetch(LOADER_VERISON);

            return response.json() as Promise<FabricLoaderVersion[]>;
        }
    });
}