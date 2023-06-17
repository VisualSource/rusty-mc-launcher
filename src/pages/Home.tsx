import { AuthenticatedTemplate, UnauthenticatedTemplate } from "@azure/msal-react";
import { useNavigate } from "react-router-dom";

import { useSelectedProfile } from "@hook/useSelectedProfile";
import type { MinecraftProfile } from "@/lib/models/profiles";
import { asLaunchConfig } from "@system/launch_config";
import useNotification from "@hook/useNotifications";
import { useProfiles } from "@hook/useProfiles";
import SelectBox from "@/components/SelectBox";
import useDownload from "@hook/useDownload";
import logger from "@/lib/system/logger";
import { play } from "@system/commands";
import useUser from "@hook/useUser";

const SelectProfileItem: React.FC<{ selected: boolean, value: MinecraftProfile }> = ({ selected, value }) => {
    return (
        <div className={`flex gap-2 items-center truncate ${selected ? 'font-medium' : 'font-normal'}`}>
            <img className="h-6 w-6 rounded-full aspect-square shadow" src={value.icon ?? "/images/Vanilla.webp"} alt="profile icon" />
            <span>{value.name}</span>
        </div>
    );
}

const Home: React.FC = () => {
    const download = useDownload();
    const navigate = useNavigate();
    const { isLoading, user } = useUser();
    const { selected: selectedProfile, mutate, isLoading: profileLoading } = useSelectedProfile();
    const notification = useNotification();
    const { profiles, isLoading: loadingProfiles } = useProfiles();

    return (
        <div className="h-full">
            <AuthenticatedTemplate>
                <div className="h-full flex flex-col justify-center">
                    {(isLoading || profileLoading || loadingProfiles) ? (
                        <div className="flex justify-center items-center flex-col">
                            <div
                                className="inline-block h-12 w-12 animate-pulse duration-[1s] rounded-full bg-current align-[-0.125em] opacity-0 bg-gray-100"
                                role="status">
                                <span
                                    className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
                                >Loading...</span
                                >
                            </div>
                            <span className="mt-4">Loading...</span>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center">
                            <div className="flex flex-col max-w-md w-full">
                                <button onClick={async () => {
                                    if ((profiles?.length ?? 0) > 0) {
                                        try {
                                            const config = await asLaunchConfig(user, selectedProfile);

                                            document.addEventListener("mcl::install_ready", async (ev) => {
                                                if ((ev as CustomEvent<{ vaild: boolean }>).detail.vaild) {
                                                    await play(config);
                                                    notification.toast.success({
                                                        type: "success",
                                                        title: "Started Minecraft!"
                                                    });
                                                }
                                            }, { once: true });

                                            await download.install(config.version, config.game_directory);
                                        } catch (error) {
                                            logger.error(error);
                                            notification.toast.alert({
                                                type: "error",
                                                title: "Failed to start Minecraft",
                                                body: (error as Error)?.message ?? "Unkown Error"
                                            })
                                        }
                                        // play
                                        return;
                                    }
                                    navigate("/profile/create");
                                }} type="button" className="inline-block rounded bg-indigo-600 px-8 py-3 text-sm font-medium text-white transition hover:scale-110 hover:shadow-xl focus:outline-none focus:ring active:bg-indigo-500">
                                    {(profiles?.length ?? 0) > 0 ? "Play" : "Create Profile"}
                                </button>
                                <div className="mt-2">
                                    <SelectBox
                                        values={profiles!}
                                        value={selectedProfile ?? profiles?.at(0)}
                                        onChange={(ev) => mutate.mutate({ type: "set", data: ev as string })}
                                        idKey="id"
                                        nameKey="name"
                                        CustomElement={SelectProfileItem}
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </AuthenticatedTemplate>
            <UnauthenticatedTemplate>
                <div className="h-full flex flex-col justify-center items-center">Please login to A Microsoft account to play</div>
            </UnauthenticatedTemplate>
        </div>
    );
}

export default Home;