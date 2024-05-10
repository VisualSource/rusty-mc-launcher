import { parseLastVersionId } from "./parseLastVersionId";

export function buildLastVersionId({ game_version, loader_version, loader }: ReturnType<typeof parseLastVersionId>) {
    switch (loader) {
        case "vanilla":
            return game_version;
        case "fabric":
            if (!loader_version) throw new Error("Missing Loader version");
            return `fabric-loader-${loader_version}-${game_version}`
        case "forge":
            if (!loader_version) throw new Error("Missing Loader version");
            return `${game_version}-forge-${loader_version}`
        default:
            throw new Error("Failed to build lastVersionId");
    }
}