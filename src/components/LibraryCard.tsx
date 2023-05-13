import type { MinecraftProfile } from "@/lib/models/profiles";
import { Link } from "react-router-dom";

const LibraryCard = ({ profile }: { profile: MinecraftProfile }) => {
    return (
        <article
            className="flex transition hover:shadow-xl bg-gray-800 shadow-gray-800/25"
        >
            <div className="rotate-180 p-2 [writing-mode:_vertical-lr]">
                <time
                    dateTime={profile.created.toISOString()}
                    className="flex items-center justify-between gap-4 text-xs font-bold uppercase text-gray-900 dark:text-white"
                >
                    <span>{profile.created.getFullYear()}</span>
                    <span className="w-px flex-1 bg-gray-900/10 dark:bg-white/10"></span>
                    <span>{profile.created.toLocaleString("en", { day: "numeric", month: "short" })}</span>
                </time>
            </div>

            <div className="hidden sm:block sm:basis-56">
                <img
                    alt="Guitar"
                    src="./images/Vanilla.webp"
                    className="aspect-square h-full w-full object-cover"
                />
            </div>

            <div className="flex flex-1 flex-col justify-between">
                <div
                    className="border-l p-4 border-white/10 sm:!border-l-transparent sm:p-6"
                >
                    <span>
                        <h3 className="font-bold uppercase text-gray-900 dark:text-white">
                            {profile.name} - {profile.lastVersionId}
                        </h3>
                    </span>
                    <span className="text-xs font-light">Last Used - {profile.lastUsed?.toLocaleString("en", { day: "numeric", month: "short", weekday: "short", year: "numeric" }) ?? "Never Used"}</span>

                    <div className="mt-2 text-sm leading-relaxed text-gray-700 line-clamp-3 dark:text-gray-200">

                        <div className="flex flex-wrap gap-1">
                            {["fabric-loader", "forge"].includes(profile.lastVersionId) ? (
                                <span className="whitespace-nowrap rounded-full bg-indigo-100 px-2.5 py-0.5 text-sm text-indigo-700">Modded</span>
                            ) : (
                                <span className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-sm text-green-700">Vanilla</span>
                            )}
                            {profile.lastVersionId.includes("fabric-loader") ? (
                                <span className="whitespace-nowrap rounded-full bg-gray-100 px-2.5 py-0.5 text-sm text-gray-700">Fabirc</span>
                            ) : null}
                            {profile.lastVersionId.includes("forge") ? (
                                <span className="whitespace-nowrap rounded-full bg-red-100 px-2.5 py-0.5 text-sm text-red-700">Forge</span>
                            ) : null}
                            {profile.lastVersionId.includes("optifine") ? (
                                <span className="whitespace-nowrap rounded-full bg-blue-100 px-2.5 py-0.5 text-sm text-blue-700">Optifine</span>
                            ) : null}
                        </div>

                    </div>
                </div>

                <div className="sm:flex sm:items-end sm:justify-end">
                    <Link to={`/profile/${profile.id}`} className="block bg-yellow-400 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-yellow-500">
                        Edit
                    </Link>
                    <button className="block bg-green-400 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-green-500">
                        Play
                    </button>
                </div>
            </div>
        </article>

    );
}

export default LibraryCard;