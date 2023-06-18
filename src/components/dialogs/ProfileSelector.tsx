import { FaExclamation } from "react-icons/fa";
import { useEffect, useMemo, useRef, useState } from "react"
import { useDebounce } from 'use-debounce';
import semver from 'semver';

import { useProfiles } from "@/lib/hooks/useProfiles";
import Spinner from "../Spinner";
import { getLoaderType } from "@/utils/versionUtils";

const ProfileSelector = () => {
    const [query, setQuery] = useState<string>("");
    const [value] = useDebounce(query, 500);
    const [config, setConfig] = useState<{ games?: string[] | undefined, loaders?: string[] | undefined }>({});
    const { profiles, isLoading, isError } = useProfiles();
    const ref = useRef<HTMLDialogElement>(null);

    const data = useMemo(() => {
        const loaders = config.loaders;
        if (!profiles || !loaders) return profiles;

        return profiles.filter((item) => {
            const { type, game } = getLoaderType(item.lastVersionId);

            const version = semver.coerce(game);

            let gameAllowed = true;

            if (config.games) {
                gameAllowed = config.games.some(value => {
                    if (!version) return false;
                    return semver.satisfies(version, value);
                });
            }

            let loaderAllowed = true;
            if (config.loaders) {
                loaderAllowed = loaders.includes(type);
            }

            return gameAllowed && loaderAllowed;
        });
    }, [profiles, config]);

    const avaliabe = data?.filter(item => item.name.toLowerCase().includes(value.toLowerCase())) ?? [];

    useEffect(() => {
        const handle = (ev: Event) => {
            setConfig((ev as CustomEvent<{ games?: string[]; loaders?: string[] }>).detail ?? {});
            ref.current?.showModal()
        }

        document.addEventListener("mcl::open::profile-select", handle);

        if (ref.current) {
            ref.current.addEventListener("close", (ev) => {
                document.dispatchEvent(new CustomEvent("mcl::done::profile-select", { detail: ref.current?.returnValue }));
            });
        }

        return () => {
            document.removeEventListener("mcl::open::profile-select", handle);
        }
    }, []);


    return (
        <dialog ref={ref} className="w-6/12 h-96 bg-gray-800 p-0 overflow-hidden backdrop:bg-gray-950 backdrop-blur-xl backdrop:bg-opacity-50">
            <div className="border-b p-2 font-bold">
                <h1>Select Profile to install to.</h1>
            </div>
            {isLoading ? (
                <div className="flex flex-col justify-center items-center h-full gap-4">
                    <Spinner />
                    <span>Loading Profiles...</span>
                </div>
            ) : isError ? (
                <div className="flex flex-col justify-center items-center h-full gap-2">
                    <FaExclamation className="text-2xl" />
                    <span>Failed to load profiles</span>
                    <button className="block bg-red-400 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-red-500" onClick={() => ref.current?.close("null")}>Close</button>
                </div>
            ) : (
                <form method="dialog" className="h-full flex flex-col">
                    <div className="p-2 flex items-center gap-2">
                        <input value={query} onChange={(ev) => setQuery(ev.target.value)} type="text" placeholder="Search" className="w-full h-full shadow-sm border-gray-700 bg-gray-800 text-white sm:text-sm" />
                        <button className="block bg-red-400 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-red-500" onClick={() => ref.current?.close("null")}>Cancel</button>
                    </div>

                    <ul className="divide-y h-full overflow-y-scroll mb-10">
                        {avaliabe.length ? avaliabe.map((item, i) => (
                            <li key={i} className="flex gap-2 items-center p-2 cursor-pointer hover:bg-gray-700" onClick={() => ref.current?.close(item.id)}>
                                <img className="rounded-full h-10 w-10" src={item.icon ?? "/images/Vanilla.webp"} alt="profile icon" />
                                <div>
                                    <div className="font-bold tracking-tight whitespace-nowrap text-ellipsis">{item.name}</div>
                                    <div className="text-neutral-200 text-sm">{item.lastVersionId}</div>
                                </div>
                            </li>
                        )) : (
                            <li className="text-center">
                                <span>No valid profiles exist. Type creating a new one.</span>
                            </li>
                        )}
                    </ul>

                </form>
            )}
        </dialog>
    );
}

export default ProfileSelector;