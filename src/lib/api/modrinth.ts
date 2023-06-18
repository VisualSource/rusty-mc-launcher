import { parseMutationArgs } from '@tanstack/react-query';
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

type ModrinthSearchProps = {
    query?: string;
    offset?: number;
    facets?: string[][];
    index?: "relevance" | "downloads" | "follows" | "newest" | "updated"
}

type ModrinthApiError = {
    error: string;
    description: string;
}

export type ModrinthProject = {
    slug: string;
    title: string;
    description: string;
    categories: string[];
    client_side: "required" | "optional" | "unsupported";
    server_side: "required" | "optional" | "unsupported";
    project_type: "mod" | "modpack" | "resourcepack" | "shader",
    downloads: number;
    icon_url: string;
    color: number | null;
    project_id: string;
    author: string;
    display_categories: string[];
    versions: string[];
    follows: number;
    date_created: string;
    date_modified: string;
    latest_version: string;
    license: string;
    gallery: string[];
    featured_gallery: string | null;

}

export type ModrinthProjectExtended = {
    slug: string;
    title: string;
    description: string;
    categories: string[];
    client_side: "required" | "optional" | "unsupported";
    server_side: "required" | "optional" | "unsupported";
    body: string;
    additional_categories: string[];
    issues_url: string | null;
    source_url: string | null;
    wiki_url: string | null;
    discord_url: string | null;
    donation_urls: { id: string; platform: string; url: string; }[];
    project_type: "mod" | "modpack" | "resourcepack" | "shader";
    downloads: number;
    icon_url: string | null;
    color: number | null;
    id: string;
    team: string;
    moderator_message: { message: string; body: string | null; } | null;
    published: string;
    updated: string;
    approved: string;
    followers: number;
    status: "approved" | "rejected" | "draft" | "unlisted" | "archived" | "processing" | "unknown";
    license: {
        id: string;
        name: string;
        url: string | null;
    }
    versions: string[];
    game_versions: string[];
    loaders: string[];
    gallery: {
        url: string;
        featured: boolean;
        title: string;
        description: string | null;
        created: string;
        ordering: number;
    }[] | null
}

type ModrinthApiSearchResponse = {
    hits: ModrinthProject[];
    offset: number;
    limit: number;
    total_hits: number;
}

const modrinth = {
    Search: async ({ query, offset = 0, facets = [], index = "relevance" }: ModrinthSearchProps) => {
        const params = new URLSearchParams();

        if (query) params.set(query, encodeURIComponent(query));
        if (offset) params.set("offset", offset.toString());
        if (facets.length > 0) params.set("facets", JSON.stringify(facets));
        params.set("index", index);

        const userAgent = await modrinth.GetUserAgent();

        const response = await fetch(`https://api.modrinth.com/v2/search?${params.toString()}`, {
            headers: {
                "User-Agent": userAgent
            }
        });

        const body = await response.json();

        if (response.status === 200) {
            return body as ModrinthApiSearchResponse;
        }
        throw new Error((body as ModrinthApiError).error);
    },
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

        const body = await response.json();


        if (response.status === 200) {
            return body as ModrinthProjectExtended;
        }

        throw new Error("Failed to find project with given id.");
    }
}

export default modrinth;