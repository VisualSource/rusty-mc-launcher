import ModCard from "@/components/ModCard";
import { useDebounce } from 'use-debounce';
import { Fragment, useMemo, useState } from 'react';
import { mods, modsList } from "@/data/mods";
import { Listbox, Transition } from "@headlessui/react";
import { HiCheck, HiSelector } from "react-icons/hi";
import ModListCard from "@/components/ModListCard";
import { useQuery } from "@tanstack/react-query";
import modrinth from "@/lib/api/modrinth";
import Spinner from "@/components/Spinner";

const options = ["mods"] as const;

const Mods: React.FC = () => {
    const [type, setType] = useState(options[0]);
    const [search, setSearch] = useState<string>("");
    const [offset, setOffset] = useState(0);
    const [query] = useDebounce(search, 500);
    const { data, isLoading, isError } = useQuery(["projects", query, offset], async (args) => {
        const request = await modrinth.Search({ query: args.queryKey.at(1) as string | undefined, offset: args.queryKey.at(2) as number });
        return request;
    });

    return (
        <main className="h-full px-4 overflow-y-scroll">
            <div className="fixed mt-2 w-full pr-10 flex gap-2">
                <input onChange={(ev) => setSearch(ev.target.value)} value={search} placeholder="Search" className="w-full rounded-md border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm" type="text" />
                <Listbox value={type} onChange={setType}>
                    <div className="relative">
                        <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-700 bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                            <span className="block truncate">Type: {type.replace(/^\w/, c => c.toUpperCase())}</span>
                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                <HiSelector
                                    className="h-5 w-5 text-gray-400"
                                    aria-hidden="true"
                                />
                            </span>
                        </Listbox.Button>
                        <Transition
                            as={Fragment}
                            leave="transition ease-in duration-100"
                            leaveFrom="opacity-100"
                            leaveTo="opacity-0">
                            <Listbox.Options className="absolute mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border-gray-700 bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                {options.map((item, i) => (
                                    <Listbox.Option
                                        key={i}
                                        className={({ active }) =>
                                            `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-blue-600' : ''
                                            }`
                                        }
                                        value={item}
                                    >
                                        {({ selected }) => (
                                            <>
                                                <span
                                                    className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                        }`}
                                                >
                                                    {item.replace(/^\w/, c => c.toUpperCase())}
                                                </span>
                                                {selected ? (
                                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-white">
                                                        <HiCheck className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                ) : null}
                                            </>
                                        )}
                                    </Listbox.Option>
                                ))}
                            </Listbox.Options>
                        </Transition>
                    </div>
                </Listbox>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 mt-14">
                {isError ? (
                    <div className="h-full w-full flex flex-1 justify-center items-center">There was an error.</div>
                ) : isLoading ? (
                    <div className="h-full flex flex-1 justify-center items-center col-span-full row-span-full">
                        <Spinner />
                    </div>
                ) : data?.hits.length ? data.hits.map((mod, i) => (
                    mod.project_type === "mod" ? <ModCard {...mod} key={i} /> : <ModListCard {...mod} key={i} />
                )) : (
                    <div className="h-full w-full flex flex-1 justify-center items-center">No projects where found</div>
                )}
            </div>
            <div className="flex mb-4">
                <button disabled={isError || isLoading} onClick={() => setOffset((current) => current + 10)}>Next</button>
            </div>
        </main>
    );
}

export default Mods;