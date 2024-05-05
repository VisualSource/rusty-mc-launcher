import { modrinth_fetch, type SearchResult, type Version } from './core';

type Opt = ":" | "=" | "!=" | ">=" | ">" | "<=" | "<";
type Facet = `project_type${Opt}${string}` |
    `categories${Opt}${string}` |
    `versions${Opt}${string}` |
    `client_side:${Opt}${string}` |
    `server_side:${Opt}${string}` |
    `open_source${Opt}${string}`

type ProjectSearchResult = { hits: SearchResult[], offset: number; limit: number; total_hits: number };
export async function search({ limit = 10, offset = 0, facets, index = "relevance" }: {
    index: "relevance" | "downloads" | "follows" | "newest" | "updated",
    facets?: Facet[][];
    offset: number;
    limit: number;
}) {

    const params = new URLSearchParams({
        index,
        offset: offset.toString(),
        limit: limit.toString(),
    });

    if (facets) {
        params.set("facets", JSON.stringify(facets));
    }

    return modrinth_fetch<ProjectSearchResult>(`search?${params.toString()}`, undefined, {});
}

export async function getProject(slug: string): Promise<SearchResult>;
export async function getProject(id: string) {
    return modrinth_fetch<SearchResult>(`project/${id}`, undefined, {});
}

export async function getProjects(ids: string[]): Promise<SearchResult[]> {
    const params = new URLSearchParams({ ids: JSON.stringify(ids) });
    return modrinth_fetch<SearchResult[]>(`projects?${params.toString()}`, undefined, {});
}

export async function checkValidity(id: string) {
    return modrinth_fetch<{ id: string }>(`project/${id}/check`, undefined, {});
}

export async function getDependencies(id: String) {
    return modrinth_fetch<{ projects: SearchResult[], versions: Version[] }>(`project/${id}/dependencies`, undefined, {});
}

