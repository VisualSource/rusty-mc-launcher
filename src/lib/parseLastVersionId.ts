
const FABRIC_VERSION = /fabric-loader-(?<loader>\d+.\d+.\d+)-(?<game>\d+.\d+(.\d+)?(.+))/;
const FORGE_VERSION = /(?<game>\d+.\d+(.\d+)?(.+))-forge-(?<loader>\d+.\d+.\d+)/;

export function parseLastVersionId(lastVersionId: string): { loader: string, loader_version: string | null, game_version: string } {
    const isFabric = lastVersionId.indexOf("fabric-loader");

    if (isFabric !== -1 && isFabric === 0) {
        const data = lastVersionId.match(FABRIC_VERSION);
        if (!data || !data.groups) throw new Error("Failed to parse Fabric version string");

        return {
            loader: "fabric",
            loader_version: data.groups.loader,
            game_version: data.groups.game
        };
    }

    const isForge = lastVersionId.indexOf("forge");
    if (isForge !== -1) {
        const data = lastVersionId.match(FORGE_VERSION);
        if (!data || !data?.groups) throw new Error("Failed to parse forge version");
        return {
            loader: "forge",
            loader_version: data.groups.loader,
            game_version: data.groups.game
        }
    }

    return {
        loader: "vanila",
        loader_version: null,
        game_version: lastVersionId
    }
}