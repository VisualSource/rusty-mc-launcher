import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { Listbox, Transition } from '@headlessui/react'
import { Fragment } from 'react';
import useUser from "@/lib/hooks/useUser";
import { useNavigate } from "react-router-dom";
import { check_install, install, play } from "@/lib/system/commands";
import { asLaunchConfig, useMinecraftProfiles } from "@/lib/system/MinecraftProfile";
import { HiCheck, HiChevronDown } from "react-icons/hi";
import useNotification from "@/lib/hooks/useNotification";

const Home: React.FC = () => {
    const { notify } = useNotification();
    const navigate = useNavigate();
    const { isLoading, user } = useUser();
    const { profiles, isLoading: loadingProfiles, selected, mutateSelected } = useMinecraftProfiles();

    return (
        <div className="h-full">
            <AuthenticatedTemplate>
                <div className="h-full flex flex-col justify-center">
                    {(isLoading || loadingProfiles) ? (
                        <div className="flex justify-center items-center flex-col">
                            <div
                                className="inline-block h-12 w-12 animate-pulse duration-[1s] rounded-full bg-current align-[-0.125em] opacity-0 bg-gray-100"
                                role="status">
                                <span
                                    className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                                >Loading...</span
                                >
                            </div>
                            <span>Loading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex flex-col max-w-md w-full">
                                <button onClick={async () => {
                                    if ((profiles?.size ?? 0) > 0) {
                                        const config = await asLaunchConfig(user, selected.data);

                                        const isInstalled = await check_install(config.version, config.game_directory);

                                        if (!isInstalled) {
                                            await install(config.version, config.game_directory);
                                        }

                                        await play(config);
                                        notify("Started Minecraft");
                                        // play
                                        return;
                                    }
                                    navigate("/profile/create");
                                }} type="button" className="inline-block rounded bg-indigo-600 px-8 py-3 text-sm font-medium text-white transition hover:scale-110 hover:shadow-xl focus:outline-none focus:ring active:bg-indigo-500">
                                    {(profiles?.size ?? 0) > 0 ? "Play" : "Create Profile"}
                                </button>
                                <Listbox value={selected.data} onChange={async (ev) => {
                                    mutateSelected.mutate(ev);
                                }}>
                                    <div className="relative mt-2">
                                        <Listbox.Button className="relative border-gray-700 w-full cursor-default rounded-lg bg-gray-800 py-2 pl-3 pr-10 text-left shadow-md focus:outline-none focus-visible:border-indigo-500 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75 focus-visible:ring-offset-2 focus-visible:ring-offset-orange-300 sm:text-sm">
                                            <span className="block truncate text-white">{selected.data?.name ?? "Select Profile"}</span>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                                                <HiChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                            </span>
                                        </Listbox.Button>
                                        <Transition as={Fragment} leave="transition ease-in duration-100" leaveFrom="opacity-100" leaveTo="opacity-0">
                                            <Listbox.Options className="bg-gray-800 absolute mt-1 max-h-60 w-full overflow-auto rounded-md py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
                                                {(profiles?.size ?? 0) <= 0 ? (
                                                    <Listbox.Option className="relative cursor-default select-none py-2 pl-10 pr-4 text-white" disabled value={{}}>
                                                        <span className="block truncate font-normal">
                                                            No Profiles
                                                        </span>
                                                    </Listbox.Option>
                                                ) : Array.from(profiles ?? []).map(value => (
                                                    <Listbox.Option key={value.id} className={({ active }) =>
                                                        `text-white relative cursor-default select-none py-2 pl-10 pr-4 ${active ? 'bg-indigo-600' : ''
                                                        }`
                                                    } value={value}>
                                                        {({ selected }) => (
                                                            <>
                                                                <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>{value.name}</span>
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
                        </div>
                    )}
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <div className="h-full flex flex-col justify-center">Please login to A Microsoft account</div>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default Home;