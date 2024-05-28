import { coerce, minSatisfying } from "semver";
import { toast } from "react-toastify";

import type { Project, Version, VersionDependency, VersionFile } from "../api/modrinth/types.gen";
import { ProjectsService, VersionsService } from "../api/modrinth/services.gen";
import { type ContentType, download_queue } from "../models/download_queue";
import { selectProfile } from "@/components/dialog/ProfileSelection";
import { askFor } from "@/components/dialog/AskDialog";
import { workshop_content } from "../models/content";
import { db, uninstallContent } from "./commands";

async function getVersion(current: VersionDependency, loaders?: string, game?: string): Promise<Version> {
    if (current.project_id) {
        const versions = await VersionsService.getProjectVersions({
            idSlug: current.project_id!,
            gameVersions: game,
            loaders
        });

        const version = versions.at(0);
        if (!version) throw new Error("Failed to get verison");

        return version;
    } else if (current.version_id) {
        return VersionsService.getVersion({ id: current.version_id });
    }

    throw new Error(`Failed to get dependency version`, { cause: current });
}

type Dep = { type: "incompatible", dep: VersionDependency } | { type: "include", file: VersionFile, version: string, id: string };
async function* getDependencies(deps: VersionDependency[], profile: string, loaders?: string, game?: string): AsyncGenerator<Dep, null, unknown> {
    let deps_to_install = deps;

    while (deps_to_install.length) {
        const current = deps_to_install.shift();
        if (!current) continue;

        const version = await getVersion(current, loaders, game);
        const file = (version.files.find(e => e.primary) ?? version.files.at(0));
        if (!file) throw new Error("Missing file download");

        if (current.dependency_type === "incompatible") {
            const incompatible = await db.select({
                query: "SELECT * FROM profile_content WHERE id = ? AND profile = ?;",
                args: [version.project_id, profile],
                schema: workshop_content.schema
            });

            if (incompatible.length) {
                yield { type: "incompatible", dep: current };
            }
            continue;
        }

        if (current.dependency_type === "optional") {
            const project = await ProjectsService.getProject({ idSlug: version.project_id });

            const result = await askFor({
                title: "Optional Dependencies",
                description: "Install optional dependencies",
                multi: true,
                empty: "There are no optional dependencies.",
                options: [{ id: version.project_id, name: project.title!, icon: project.icon_url ?? undefined }]
            });
            if (!result.at(0)?.value) {
                continue;
            }
        }

        if (version.dependencies?.length) {
            deps_to_install.push(...version.dependencies);
        }

        yield { type: "include", file, version: version.version_number!, id: version.project_id }
    }

    return null;
}

function getClosestVersion(override: boolean, target: string, versions: string[]) {
    if (override || !target.includes(".")) {
        return [target]
    }
    const t = coerce(target);
    if (!t) return [target];

    const id = minSatisfying(versions, `${t.major}.${t.minor}.x`);
    return [id ?? target];
}

export async function install(data: Project) {
    const id = toast.loading("Preparing install...");
    try {
        switch (data.project_type) {
            case "resourcepack":
            case "shader": {
                const profile = await selectProfile({ game: data.game_versions, loaders: data.loaders });
                if (!profile) {
                    toast.update(id, { render: "Install canceled", type: "info", isLoading: false, autoClose: 5000 });
                    return;
                }

                const versions = await VersionsService.getProjectVersions({
                    idSlug: data.id,
                });
                const version = versions.at(0);
                if (!version) throw new Error("No versions are avaiable");

                const file = (version.files.find(e => e.primary) ?? version.files.at(0));
                if (!file) throw new Error("No file download was found");

                await uninstallContent(profile.id, data.id);

                const files = [{
                    sha1: file?.hashes.sha1,
                    url: file?.url,
                    filename: file.filename,
                    version: version.version_number!,
                    id: data.id
                }];
                const content_id = data.project_type.replace(/^\w/, data.project_type[0].toUpperCase()) as ContentType;
                const queue_id = crypto.randomUUID();

                await download_queue.insert(queue_id, true, 0,
                    data.title!,
                    data.icon_url ?? null,
                    profile.id,
                    content_id,
                    {
                        content_type: content_id,
                        profile: profile.id,
                        files: files
                    }
                );

                break;
            }
            case "mod": {
                const profile = await selectProfile({ game: data.game_versions, loaders: data.loaders });
                if (!profile) {
                    toast.update(id, { render: "Install canceled", type: "info", isLoading: false, autoClose: 5000 });
                    return;
                }

                const target = getClosestVersion(data.game_versions?.includes(profile.version) ?? false, profile.version, data.game_versions ?? []);

                const loaders = JSON.stringify([profile.loader]);
                const gameVersions = JSON.stringify(target);
                const versions = await VersionsService.getProjectVersions({
                    idSlug: data.id,
                    loaders,
                    gameVersions
                });
                const version = versions.at(0);
                if (!version) throw new Error("No versions are avaiable");

                const file = (version.files.find(e => e.primary) ?? version.files.at(0));
                if (!file) throw new Error("No file download was found");

                await uninstallContent(profile.id, data.id);

                const files = [{
                    sha1: file?.hashes.sha1,
                    url: file?.url,
                    filename: file.filename,
                    version: version.version_number!,
                    id: data.id
                }];
                if (version.dependencies?.length) {
                    for await (const dep of getDependencies(version.dependencies, profile.id, loaders, gameVersions)) {
                        switch (dep.type) {
                            case "incompatible":
                                throw new Error("Incompatible with current install", { cause: dep.dep });
                            case "include": {
                                if (!dep.file) throw new Error("Missing file download");

                                await uninstallContent(profile.id, dep.id);

                                files.push({
                                    sha1: dep.file?.hashes.sha1,
                                    url: dep.file?.url,
                                    id: dep.id,
                                    filename: dep.file?.filename,
                                    version: dep.version
                                });
                                break;
                            }
                            default:
                                break;
                        }
                    }
                }

                const content_id = data.project_type.replace(/^\w/, data.project_type[0].toUpperCase()) as ContentType;
                const queue_id = crypto.randomUUID();

                await download_queue.insert(queue_id, true, 0, data.title!, data.icon_url ?? null, profile.id, content_id, {
                    content_type: content_id,
                    profile: profile.id,
                    files: files
                });

                break;
            }
            case "modpack": {
                const gameVersions = await askFor({
                    title: "Select game version",
                    description: "Select the game version to use",
                    empty: "No versions found",
                    options: data.game_versions?.map(e => ({ id: e, name: e })).toReversed() ?? [],
                    multi: false
                });

                if (!gameVersions.length) {
                    toast.update(id, { render: "Install canceled", type: "info", isLoading: false, autoClose: 5000 });
                    return;
                }

                const loaders = await askFor({
                    title: "Select Modloader",
                    description: "Select the modloader to use",
                    empty: "No loaders found",
                    multi: false,
                    options: data.loaders?.map(e => ({ id: e, name: e })) ?? []
                });
                if (!loaders.length) {
                    toast.update(id, { render: "Install canceled", type: "info", isLoading: false, autoClose: 5000 });
                    return;
                }

                const version_data = await VersionsService.getProjectVersions({
                    loaders: JSON.stringify(loaders.map(e => e.id)),
                    gameVersions: JSON.stringify(gameVersions.map(e => e.id)),
                    idSlug: data.id
                });

                const version = version_data.at(0);
                if (!version) return;

                const file = (version.files.find(e => e.primary) ?? version.files.at(0));
                if (!version) return;

                const queue_id = crypto.randomUUID();
                const profile = crypto.randomUUID();

                await download_queue.insert(queue_id, true, 0, data.title!, data.icon_url ?? null, profile, "Modpack", {
                    content_type: "Modpack",
                    profile,
                    files: [{
                        sha1: file?.hashes.sha1,
                        url: file?.url,
                        id: data.id,
                        filename: file?.filename,
                        version: version.version_number!
                    }]
                });
                break;
            }
            default:
                break;
        }
        toast.update(id, { render: "Staring Install", type: "success", isLoading: false, autoClose: 5000 });
    } catch (error) {
        toast.update(id, { render: "Failed to install content", type: "error", isLoading: false, data: { error: (error as Error).message }, autoClose: 5000 })
    }
}