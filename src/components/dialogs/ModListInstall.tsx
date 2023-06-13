import { mods, modsList } from "@/data/mods";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useEffect, useMemo, useRef, useState } from "react"
import { Controller, useForm } from "react-hook-form";
import Spinner from "../Spinner";
import modrinth from "@/lib/api/modrinth";
import useMinecraftVersions from "@/lib/hooks/useMinecraftVersion";
import { Listbox, Transition } from "@headlessui/react";
import { HiCheck, HiSelector } from "react-icons/hi";

const ModListInstall = () => {
    const ref = useRef<HTMLDialogElement>(null);
    const { handleSubmit, control, formState: { isSubmitting } } = useForm<{ version: string }>();
    const [modlistId, setModListId] = useState<string | undefined>();
    const { data, isLoading, isError, refetch } = useQuery([modlistId, "modlist"], async (args) => {
        const id = args.queryKey[0];
        if (!id) throw new Error("Invaild key");
        const list = modsList[id as keyof typeof modsList];
        if (!list) throw new Error("Failed to get modlist");

        const modsToInstall = list.mods.map(mod => mods[mod]);

        const versionData = await Promise.all(modsToInstall.map(value => modrinth.GetProjectData(value.download.type === "modrinth" ? value.download.id : "")))

        return {
            mods: modsToInstall,
            versionData,
            installs: [],
        }
    }, { enabled: !modlistId });
    const { data: minecraftVersions, isLoading: areVersionsLoading, isError: versionsHasError } = useMinecraftVersions("fabric");

    useEffect(() => {
        const handle = (ev: Event) => {
            if (!(ev as CustomEvent).detail) return;
            setModListId((ev as CustomEvent<string>).detail);
            ref.current?.showModal();
            refetch();
        }
        document.addEventListener("install_modlist", handle);
        if (ref.current) {
            ref.current.addEventListener("close", (ev) => {
                document.dispatchEvent(new CustomEvent("install_modlist_return", { detail: ref.current?.returnValue }));
            });
        }

        return () => {
            document.removeEventListener("install_modlist", handle);
        }
    }, []);


    const onSubmit = async ({ version }: { version: string }) => {


    }

    return (
        <dialog ref={ref} className="w-6/12 h-96 bg-gray-800 p-0 overflow-hidden backdrop:bg-gray-950 backdrop-blur-xl backdrop:bg-opacity-50">
            <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col flex-1">
                <div className="border-b p-2 font-bold">
                    <h1>Install Mod Pack</h1>
                </div>
                {isError ? (
                    <div>
                        Failed to load modpack data
                    </div>
                ) : null}
                {isLoading || areVersionsLoading ? (
                    <div className="flex-1">
                        <Spinner />
                        <div>Loading modpack data</div>
                    </div>
                ) : (
                    <div className="overflow-y-scroll">
                        <p className="p-2">
                            Installing this mod pack will create a profile with this packs name and the minecraft version you select.
                        </p>
                        <div className="flex flex-col px-2">
                            <label htmlFor="version">Minecraft Version</label>
                            <Controller control={control} name="version" render={({ field }) => (
                                <Listbox value={field.value ?? minecraftVersions?.latest} onChange={field.onChange}>
                                    <div className="relative">
                                        <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-700 bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                            <span className="block truncate">{field.value}</span>
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
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="absolute mt-1 z-50 max-h-60 w-full overflow-auto rounded-md border-gray-700 bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {minecraftVersions?.versions.map((person, personIdx) => (
                                                    <Listbox.Option
                                                        key={personIdx}
                                                        className={({ active }) =>
                                                            `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-blue-600' : ''
                                                            }`
                                                        }
                                                        value={person.id}
                                                    >
                                                        {({ selected }) => (
                                                            <>
                                                                <span
                                                                    className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                        }`}
                                                                >
                                                                    {person.id}
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
                            )} />
                        </div>
                        <div className="flex-1 px-2">
                            <h3 className="font-bold py-2">Mods</h3>
                            <ul className="flex-1 divide-y divide-gray-600">
                                {data?.mods.map((mod, i) => (
                                    <li key={i} className="flex overflow-hidden py-4 gap-2 items-center">
                                        <img className="aspect-square h-14 w-14" src={mod.img.src} alt={mod.img.alt} />
                                        <div className="w-full">
                                            <h4 className="font-bold">{mod.name}</h4>
                                            <p className="text-sm w-full whitespace-nowrap text-ellipsis overflow-hidden">{mod.description}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>)}
                <div className="flex justify-between p-1">
                    <button type="button" onClick={() => ref.current?.close("null")} className="block bg-red-300 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-red-400">Cancel</button>
                    <button disabled={isLoading || areVersionsLoading || isSubmitting} type="submit" className="block bg-green-300 px-5 py-3 text-center text-xs font-bold uppercase text-gray-900 transition hover:bg-green-400">Ok</button>
                </div>
            </form>
        </dialog>
    );
}

export default ModListInstall;