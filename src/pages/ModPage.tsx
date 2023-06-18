import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { HiChevronDown } from "react-icons/hi";
import ReactMarkdown from "react-markdown";
import remarkGfm from 'remark-gfm';

import Spinner from "@/components/Spinner";
import IconLinks from "@/components/ModCardIcon";
import logger from "@/lib/system/logger";
import { selectProfileFromDialog } from "@/lib/selectProfile";
import useDownload from "@/lib/hooks/useDownload";
import modrinth from "@/lib/api/modrinth";
import { selectVersionDialog } from "@/lib/selectVersion";

const ModPage: React.FC = () => {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const { installMods, installPack } = useDownload();
    const { data, isError, isLoading, error } = useQuery([uuid, "mod"], async () => {
        if (!uuid) throw new Error("Invaild uuid");
        const project = await modrinth.GetProjectData(uuid);
        return project;
    }, { enabled: !!uuid });

    const installMod = async () => {
        try {
            if (!data) return;

            switch (data.project_type) {
                case "mod":
                    const versionSelected = await selectVersionDialog({ games: data?.game_versions, loaders: data?.loaders });
                    if (!versionSelected) throw new Error("No Version/modloader was picked aborting");
                    const profile = await selectProfileFromDialog({ loaders: [versionSelected.loader], games: [versionSelected.game] });
                    if (!profile) return;
                    installMods(profile, [data.slug]);
                    break;
                case "modpack":
                    break;
                case "resourcepack":
                    installPack(data.slug, "resource");
                    break;
                case "shader":
                    installPack(data.slug, "shader");
                    break;
                default:
                    break;
            }
        } catch (error) {
            logger.error(error);
        }
    }

    return (
        <main data-modrinth-slug={uuid} className="flex flex-col h-full overflow-hidden">
            {isError ? (<span>Failed to load mods</span>) : null}
            {isLoading && !isError ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <Spinner />
                </div>
            ) : null}
            {data && !isError && !isLoading ? (
                <div className="flex flex-col h-full overflow-y-auto items-center">
                    <div className="flex w-full justify-between px-4 pt-2 items-center">
                        <div className="flex gap-3 items-center">
                            <button className="block bg-yellow-300 px-5 py-2 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-yellow-400" onClick={() => navigate("/mods")}>Back</button>
                            <IconLinks links={[
                                { type: "discord", href: data.discord_url },
                                { type: "issues", href: data.issues_url },
                                { type: "source", href: data.source_url },
                                { type: "wiki", href: data.wiki_url },
                                ...data.donation_urls.map(value => ({ type: value.platform, href: value.url })) as any[]
                            ]} />
                        </div>
                        <div className="relative">
                            <div className="inline-flex items-center overflow-hidden bg-green-500">
                                <button disabled={data.project_type === "modpack"} onClick={installMod} className="border-e disabled:cursor-not-allowed border-green-700 px-4 py-2 text-sm/none text-white hover:bg-green-600">
                                    Install
                                </button>
                                <button className="h-full p-2 text-gray-600 hover:bg-green-600 bg-green-500">
                                    <span className="sr-only">Menu</span>
                                    <HiChevronDown className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="w-full px-8 mb-4">
                        <h1 className="text-4xl font-bold my-4">{data.title}</h1>
                        <h6 className="tracking-tight font-medium mb-2">Mod Loaders</h6>
                        <div className="flex gap-2 mb-2">
                            {data.loaders.map(loader => (<span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-xs text-green-700" key={loader}>{loader}</span>))}
                        </div>
                        <h6 className="tracking-tight font-medium mb-2">Minecraft</h6>
                        <div className="flex gap-2 overflow-hidden flex-wrap">
                            {data.game_versions.toReversed().slice(0, 13).map(loader => (<span className="whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700" key={loader}>{loader}</span>))}
                            {data.game_versions.length > 13 ? (
                                <span className="whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-0.5 text-xs text-blue-700">+{data.game_versions.length - 13} versions</span>
                            ) : null}
                        </div>
                    </div>
                    <article className="prose max-w-4xl prose-invert mb-4">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {data.body}
                        </ReactMarkdown>
                    </article>
                </div>
            ) : null}
        </main>
    )
}

export default ModPage;