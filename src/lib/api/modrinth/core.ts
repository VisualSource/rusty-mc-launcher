type Support = "required" | "optional" | "unsupported";
type ProjectType = "mod" | "modpack" | "resourcepack" | "shader";
type MonetizationStatus = "monetized" | "demonetized" | "force-demonetized";

export type Project = {
    /** The slug of a project, used for vanity URLs. Regex: ^[\w!@$()`.+,"\-']{3,64}$ */
    slug: string;
    /** The title or name of the project */
    title: string;
    /** A short description of the project */
    description: string;
    /** A list of the categories that the project has */
    categories: string[];
    /** The client side support of the project */
    client_side: Support;
    /** The server side support of the project */
    server_side: Support;
    /** A long form description of the project */
    body: string;
    /** The status of the project */
    status: "approved" | "archived" | "rejected" | "draft" | "unlisted" | "processing" | "withheld" | "scheduled" | "private" | "unknown";
    /** The project type of the project */
    project_type: ProjectType;
    /** The total number of downloads of the project */
    downloads: number;
    /** The ID of the project, encoded as a base62 string */
    id: string;
    /** The ID of the team that has ownership of this project */
    team: string;
    /** The date the project was published */
    published: string;
    /** The date the project was last updated */
    updated: string;
    /** The total number of users following the project */
    followers: number;
    /** The date the project's status was set to an approved status */
    approved?: string | null;
    /** The date the project's status was submitted to moderators for review */
    queued?: string | null;
    /** The requested status when submitting for review or scheduling the project for release */
    requested_status?: "approved" | "archived" | "unlisted" | "private" | "draft" | null;
    /** A list of categories which are searchable but non-primary */
    additional_categories?: string[];
    /** An optional link to where to submit bugs or issues with the project */
    issues_url?: string | null;
    /** An optional link to the source code of the project */
    source_url?: string | null;
    /** An optional link to the project's wiki page or other relevant information */
    wiki_url?: string | null;
    /** An optional invite link to the project's discord */
    discord_url?: string | null;
    /** A list of donation links for the project */
    donation_urls?: {
        /** The ID of the donation platform */
        id: string;
        /** The donation platform this link is to */
        platform: string;
        /** The URL of the donation platform and user */
        url: string;
    }[];
    /** The URL of the project's icon */
    icon_url?: string | null;
    /** The RGB color of the project, automatically generated from the project icon */
    color?: number | null;
    /** The ID of the moderation thread associated with this project */
    thread_id?: string;
    monetization_status?: MonetizationStatus;
    /** The license of the project */
    license?: {
        /** The SPDX license ID of a project */
        id: string;
        /** The long name of a license*/
        name: string;
        /** The URL to this license */
        url?: string | null
    }
    /** A list of the version IDs of the project (will never be empty unless draft status) */
    versions?: string[];
    /** A list of all of the game versions supported by the project */
    game_versions?: string[];
    /** A list of all of the loaders supported by the project */
    loaders?: string[];
    /** A list of images that have been uploaded to the project's gallery */
    gallery?: {
        /** The URL of the gallery image */
        url: string;
        /** Whether the image is featured in the gallery */
        featured: boolean;
        /** The date and time the gallery image was created */
        created: string;
        /** The title of the gallery image */
        title?: string | null;
        /** The description of the gallery image */
        description?: string | null;
        /** The order of the gallery image. Gallery images are sorted by this field and then alphabetically by title. */
        ordering?: number;
    }[] | null;
}

export type SearchResult = {
    /** The slug of a project, used for vanity URLs. Regex: ^[\w!@$()`.+,"\-']{3,64}$ */
    slug: string;
    /** The title or name of the project */
    title: string;
    /** A short description of the project */
    description: string;
    /** A list of the categories that the project has */
    categories?: string[];
    /** The client side support of the project */
    client_side: Support;
    /** The server side support of the project */
    server_side: Support;
    /** The project type of the project */
    project_type: ProjectType;
    /** The total number of downloads of the project */
    downloads: number;
    /** The URL of the project's icon */
    icon_url?: string | null;
    /** The RGB color of the project, automatically generated from the project icon */
    color?: number | null;
    /** The ID of the moderation thread associated with this project  */
    thread_id?: string;
    monetization_status?: MonetizationStatus;
    /** The ID of the project */
    project_id: string;
    /** The username of the project's author  */
    author: string;
    /** A list of the categories that the project has which are not secondary */
    display_categories: string[];
    /** A list of the minecraft versions supported by the project */
    versions: string[];
    /** The total number of users following the project */
    follows: number;
    /** The date the project was added to search */
    date_created: string;
    /** The date the project was last modified */
    date_modified: string;
    /** The latest version of minecraft that this project supports */
    latest_version?: string;
    /** The SPDX license ID of a project */
    license?: string;
    /** All gallery images attached to the project */
    gallery?: string[];
    /** The featured gallery image of the project */
    featured_gallery?: string | null;
}

export type Version = {
    name: string;
    version_number: string;
    changelog?: string | null;
    dependencies?: {
        version_id: string | null;
        project_id: string | null;
        file_name: string | null;
        dependency_type: "required" | "optional" | "incompatible" | "embedded";
    }[];
    game_versions: string[];
    version_type: "release" | "beta" | "alpha";
    loaders: string[];
    featured: boolean;
    status?: "listed" | "archived" | "draft" | "unlisted" | "scheduled" | "unknown";
    requested_status?: "listed" | "archived" | "draft" | "unlisted" | null;
    id: string;
    project_id: string;
    author_id: string;
    date_published: string;
    downloads: number;
    files: {
        hashes: {
            sha512: string;
            sha1: string;
        }
        url: string;
        filename: string;
        primary: boolean;
        size: number;
        file_type?: "required-resource-pack" | "optional-resource-pack" | null;
    }[];
}

export type User = {
    username: string;
    name?: string | null;
    email?: string | null;
    bio?: string;
    id: string;
    avatar_url: string;
    created: string;
    role: "admin" | "moderator" | "developer";
    badges: number;
    auth_providers?: string[] | null;
    email_verified?: boolean | null;
    has_password?: boolean | null;
    has_totp?: boolean | null;
}

type RequestConfig = {
    staging?: boolean;
    headers?: Record<string, string>

}

export async function modrinth_fetch<T>(path: string, body: undefined | object, settings: RequestConfig) {
    const host = settings.staging ? "staging-api.modrinth.com" : "api.modrinth.com";

    const response = await fetch(`https://${host}/v2/${path}`, {
        headers: settings.headers,
        body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) throw response;

    return response.json() as Promise<T>;
}