import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { Listbox } from '@headlessui/react'
import { useState } from 'react';
import useUser from "@/lib/hooks/useUser";
import { install, play } from "@/lib/system/commands";

const profiles = [
    { id: 1, name: "Some Profile", unavailable: false }
];

const profile = (user: any) => ({
    classpath: "",
    console: true,
    game_directory: "C:\\Users\\Collin\\AppData\\Roaming\\.minecraft",
    classpath_separator: ";",
    version: "fabric-loader-0.14.18-1.19.4",
    token: user?.minecraft?.token.access_token,
    uuid: user?.minecraft?.profile.id,
    xuid: user?.minecraft?.xuid,
    version_type: "release",
    client_id: import.meta.env.PUBLIC_VITE_CLIENT_ID,
    username: user?.minecraft?.profile.name,
    use_custom_resolution: false,
    is_demo: false,
    enable_logging_config: false,
    disable_mulitplayer: false,
    disable_chat: false,
})

const Home = () => {
    const { isLoading, user } = useUser();
    const [selected, setSelected] = useState({ id: 1, name: "Some Profile", unavailable: false });

    return (
        <div className="h-full">
            <AuthenticatedTemplate>
                <div className="h-full flex flex-col justify-center">
                    {isLoading ? (
                        <div>Loading</div>
                    ) : (
                        <div className="flex justify-center flex-col items-center">
                            <button type="button" className="inline-block rounded bg-indigo-600 px-8 py-3 text-sm font-medium text-white transition hover:scale-110 hover:shadow-xl focus:outline-none focus:ring active:bg-indigo-500" onClick={async () => {
                                const config = profile(user);
                                //const installer = await install("fabric-loader-0.14.18-1.19.4", config.game_directory);
                                // console.log("Done Installing");
                                const run = await play(config);
                                console.log("Booted");
                            }}>Play</button>
                            <Listbox value={selected} onChange={setSelected}>
                                <Listbox.Button>{selected.name}</Listbox.Button>
                                <Listbox.Options>
                                    {profiles.map(value => (
                                        <Listbox.Option key={value.id} value={value} disabled={value.unavailable}>{value.name}</Listbox.Option>
                                    ))}
                                </Listbox.Options>
                            </Listbox>
                        </div>
                    )}
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <div>Please login to A Micrsoft account</div>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default Home;