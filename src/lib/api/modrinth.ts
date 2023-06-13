import { getVersion } from '@tauri-apps/api/app';
type Version = {
    id: string;
    name: string;
    project_id: string;
    version_number: string;
    game_versions: string[];
    loaders: string[];
    files: {
        primary: boolean;
        hashes: {
            sha1: string;
        }
        url: string;
        size: number;
    }[],
    dependencies: {
        project_id: string;
        dependency_type: "required"
    }[]
}

export type FileDownload = {
    id: string;
    name: string;
    version: string;
    download: {
        hash: string;
        url: string;
        size: number;
    }
}

const modrinth = {
    GetUserAgent: async () => {
        const version = await getVersion();
        return `VisualSource/rusty-mc-launcher/${version} collin_blosser@yahoo.com`
    },
    GetVersionFiles: async (id: string, loader?: string, game?: string): Promise<FileDownload[]> => {
        const params = new URLSearchParams();
        if (loader) params.set("loaders", `["${loader}"]`);
        if (game) params.set("game_versions", `["${game}"]`);

        const userAgent = await modrinth.GetUserAgent();

        const response = await fetch(`https://api.modrinth.com/v2/project/${id}/version?${params.toString()}`, {
            headers: {
                "User-Agent": userAgent
            }
        });

        if (!response.ok) throw new Error("Failed to fetch mod data", { cause: "FAILED_TO_REQUEST_DATA" });

        const content = await response.json() as Version[];

        const first = content.at(0);

        if (!first) throw new Error("No version avaliabe for this wanted version.", { cause: "NO_VAILD_VERSIONS" })

        const file = first?.files.find(value => value.primary);

        if (!file) throw new Error("Failed to get file download", { cause: "FAILED_TO_FIND_PRIMARY_DOWNLOAD" });

        const files: FileDownload[] = [
            {
                id: first.project_id,
                name: first.name,
                version: first.version_number,
                download: {
                    hash: file.hashes.sha1,
                    url: file.url,
                    size: file.size,
                }
            }
        ];

        const deps = await Promise.all(first.dependencies.map(async (item) => {
            return modrinth.GetVersionFiles(item.project_id, loader, game);
        }));

        return [...files, ...deps.flat(2).filter(Boolean)];
    },
    GetProjectData: async (id: string) => {
        const userAgent = await modrinth.GetUserAgent();

        const response = await fetch(`https://api.modrinth.com/v2/project/${id}`, {
            headers: {
                "User-Agent": userAgent
            }
        });
        if (!response.ok) throw new Error("Failed to fetch mod data", { cause: "FAILED_TO_REQUEST_DATA" });
        const content = await response.json() as {
            game_versions: string[];
            loaders: string[]
        }

        return {
            id,
            game_versions: content.game_versions,
            loaders: content.loaders
        }
    }
}

export default modrinth;