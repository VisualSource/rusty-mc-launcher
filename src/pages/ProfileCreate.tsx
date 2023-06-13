import { useIsAuthenticated } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from 'react-hook-form';
import { Fragment, useEffect, useState } from 'react';
import { useProfiles } from "@/lib/hooks/useProfiles";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { useQuery } from "@tanstack/react-query";
import { Combobox, Listbox, Transition } from "@headlessui/react";
import { HiCheck, HiSelector } from "react-icons/hi";
import useMinecraftVersions, { LoaderType } from "@/lib/hooks/useMinecraftVersion";

const versions: { name: string; id: LoaderType }[] = [
    { name: "Vanilla", id: "vanilla" },
    { name: "Fabric", id: "fabric" }
];

const ProfileCreate: React.FC = () => {
    const [verison, setVersion] = useState(versions[0]);
    const { data, isLoading } = useMinecraftVersions(verison.id);
    const { register, handleSubmit, control } = useForm<MinecraftProfile>({
        defaultValues: {
            console: true,
            is_demo: false,
            disable_chat: false,
            disable_mulitplayer: false,
            lastVersionId: "latest-release",
            name: "",
            javaArgs: [],
            gameDir: undefined,
            javaDir: undefined,
            id: crypto.randomUUID(),
            resolution: undefined,
        }
    });
    const { mutate } = useProfiles();
    const navigate = useNavigate();
    const isAuthenticated = useIsAuthenticated();
    const [query, setQuery] = useState('');

    const filterd = query === "" ? data?.versions ?? [] : (data?.versions ?? []).filter(version => version.id.includes(query));

    const onSubmit = async (state: MinecraftProfile) => {
        await mutate.mutateAsync({
            type: "create",
            data: {
                ...state,
                created: new Date()
            }
        });
        navigate("/", { replace: true });
    }

    useEffect(() => {
        if (!isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center">
                <h1>Loading...</h1>
            </div>
        );
    }

    return (
        <div className="flex-1 flex justify-center">
            <form className="container mt-4" onSubmit={handleSubmit(onSubmit)}>
                <div>
                    <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">
                        Profile Name*
                    </label>
                    <input required placeholder="name" className="mt-1 w-full rounded-md border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white sm:text-sm" id="name" type="text" {...register("name", { required: "A name is required" })} />
                </div>
                <div className="mt-4">
                    <label htmlFor="modded" className="block text-xs font-medium text-gray-700 dark:text-gray-200">
                        Minecraft Type
                    </label>
                    <Listbox value={verison} onChange={setVersion}>
                        <div className="relative mt-1">
                            <Listbox.Button className="relative w-full cursor-default rounded-lg border border-gray-700 bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                <span className="block truncate">{verison.name}</span>
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
                                    {versions.map((person, personIdx) => (
                                        <Listbox.Option
                                            key={personIdx}
                                            className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-blue-600' : ''
                                                }`
                                            }
                                            value={person}
                                        >
                                            {({ selected }) => (
                                                <>
                                                    <span
                                                        className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                            }`}
                                                    >
                                                        {person.name}
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
                <div className="mt-4">
                    <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">
                        Minecraft Vesion*
                    </label>
                    <Controller control={control} rules={{ required: "A version is required" }} name="lastVersionId" render={({ field, fieldState }) => (
                        <Combobox value={data?.versions.find(version => version.id === field.value) ?? { id: "latest-release", type: "latest-release" }} onChange={(ev) => field.onChange(ev.id)
                        }>
                            <div className="relative mt-1">
                                <div className="relative w-full cursor-default overflow-hidden rounded-lg bg-white text-left shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-teal-300 sm:text-sm">
                                    <Combobox.Input className="w-full border-gray-700 bg-gray-800 py-2 pl-3 pr-10 text-sm leading-5 text-white focus:ring-0 sm:text-sm" displayValue={(version: any) => version.id} onChange={(ev) => setQuery(ev.target.value)} />
                                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                                        <HiSelector className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                    </Combobox.Button>
                                </div>
                                <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0" afterLeave={() => setQuery('')}>
                                    <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-md bg-gray-800 py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                        {!filterd.length && query !== "" ? (
                                            <div className="relative cursor-default select-none py-2 px-4 text-gray-700">No Version found</div>
                                        ) : filterd.map(version => (
                                            <Combobox.Option className={({ active }) =>
                                                `relative cursor-default select-none py-2 pl-10 pr-4 text-white ${active ? 'bg-blue-600' : ''
                                                }`
                                            } key={version.id} value={version}>
                                                {({ selected, active }) => (
                                                    <>
                                                        <span
                                                            className={`block truncate ${selected ? 'font-medium' : 'font-normal'
                                                                }`}
                                                        >
                                                            {version.id}
                                                        </span>
                                                        {selected ? (
                                                            <span
                                                                className={`absolute inset-y-0 left-0 flex items-center pl-3 ${active ? 'text-white' : 'text-blue-600'
                                                                    }`}
                                                            >
                                                                <HiCheck className="h-5 w-5" aria-hidden="true" />
                                                            </span>
                                                        ) : null}
                                                    </>
                                                )}
                                            </Combobox.Option>
                                        ))}
                                    </Combobox.Options>
                                </Transition>
                            </div>
                            {fieldState?.error ? (
                                <span className="text-red-400 text-sm">{fieldState.error.message}</span>
                            ) : null}
                        </Combobox>
                    )} />
                </div>

                <div className="mt-4">
                    <button type="submit" className="w-full inline-block rounded bg-indigo-600 px-8 py-3 text-sm font-medium text-white transition hover:shadow-xl focus:outline-none focus:ring active:bg-indigo-500">Create</button>
                </div>
            </form>
        </div>
    );
}

export default ProfileCreate;