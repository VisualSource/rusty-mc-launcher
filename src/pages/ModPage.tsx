import { useQuery } from "@tanstack/react-query";
import { HiChevronDown } from "react-icons/hi";
import { useParams, useNavigate } from "react-router-dom";
import { Octokit } from "@octokit/rest";
import Spinner from "@/components/Spinner";

import { mods } from "@/data/mods";
import IconLinks from "@/components/ModCardIcon";

const ModPage: React.FC = () => {
    const navigate = useNavigate();
    const { uuid } = useParams();
    const { data, isError, isLoading, error } = useQuery([uuid, "mod"], async () => {
        if (!uuid) throw new Error("Invaild uuid");

        const mod = mods[uuid];
        if (!mod) throw new Error("Failed to find mod");

        if (mod.provider.type === "github") {
            const octokit = new Octokit();
            const repo = await octokit.rest.repos.get({
                owner: mod.provider.owner,
                repo: mod.provider.repo,
            });
            const readme = await octokit.rest.repos.getReadme({
                owner: mod.provider.owner,
                repo: mod.provider.repo,
                mediaType: {
                    format: "html"
                },
                //baseUrl: `https://github.com/${mod.provider.owner}/${mod.provider.repo}/raw/${repo.data.default_branch}`
            });
            //https://github.com/IrisShaders/Iris/raw/1.19.4/docs/banner.png
            //https://github.com/CaffeineMC/lithium-fabric/raw/develop/src/main/resources/assets/lithium/icon.png
            return {
                name: mod.name,
                content: (readme.data as never as string),
                type: mod.provider.type,
                links: mod.links,
                replaceImage: {
                    root: mod.provider.imageRoot,
                    base: `https://github.com/${mod.provider.owner}/${mod.provider.repo}/raw/${repo.data.default_branch}/${mod.provider.imageRoot}`
                }
            }
        }

        return {
            name: mod.name,
            links: mod.links,
            content: "",
            type: mod.provider.type
        }
    }, { enabled: !!uuid });

    return (
        <main className="flex flex-col h-full overflow-hidden">
            {isError ? (JSON.stringify(error)) : null}
            {isLoading ? (
                <div className="h-full w-full flex flex-col items-center justify-center">
                    <Spinner />
                </div>
            ) : null}
            {data && !isError && !isLoading ? (
                <div className="flex flex-col h-full overflow-y-auto items-center">
                    <div className="flex w-full justify-between px-4 pt-2 items-center">
                        <div className="flex gap-3 items-center">
                            <button className="block bg-yellow-300 px-5 py-2 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-yellow-400" onClick={() => navigate("/mods")}>Back</button>
                            <IconLinks links={data.links} />
                        </div>
                        <div className="relative">
                            <div className="inline-flex items-center overflow-hidden bg-green-500">
                                <a href="#" className="border-e border-green-700 px-4 py-2 text-sm/none text-white hover:bg-green-600">
                                    Install
                                </a>
                                <button className="h-full p-2 text-gray-600 hover:bg-green-600">
                                    <span className="sr-only">Menu</span>
                                    <HiChevronDown className="h-4 w-4 text-white" />
                                </button>
                            </div>
                        </div>
                    </div>
                    {data.type === "github" ? (<article dangerouslySetInnerHTML={{ __html: data.content.replaceAll(data.replaceImage.root, data.replaceImage.base) }} className="prose max-w-4xl prose-invert"></article>) : null}

                </div>
            ) : null}
        </main>
    )
}

export default ModPage;