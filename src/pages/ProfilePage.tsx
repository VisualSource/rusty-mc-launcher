import { useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { HiSave } from "react-icons/hi";

import type { MinecraftProfile } from "@lib/models/profiles";
import useNotification from "@hook/useNotifications";
import { useProfile } from "@hook/useProfile";
import profiles from "@/lib/models/profiles";
import Spinner from "@/components/Spinner";

const ProfilePage: React.FC = () => {
    const { id } = useParams();
    const { mutate } = useProfile(id, false);
    const notify = useNotification();
    //const [loaderType, setLoaderType] = useState<LoaderType>(getLoaderType(profile?.lastVersionId ?? "").type ?? "vanilla");
    //const { data: minecraftVersions, isLoading: minecraftVersionsLoading, } = useMinecraftVersions(loaderType);

    const { handleSubmit, register, watch, formState: { defaultValues, isLoading } } = useForm<MinecraftProfile>({
        defaultValues: async () => {
            const profile = await profiles.findOne({
                where: [{ id }]
            });

            if (!profile) throw new Error("Failed to load profile");

            return profile;
        }
    });

    const mods = watch("mods");

    const onSubmit = async (state: MinecraftProfile) => {
        await mutate.mutateAsync({ type: "patch", data: state });
        notify.toast.success({ title: "Updated Profile", type: "success" });
    }

    return (
        <main className="h-full px-2 pt-4 overflow-y-scroll">
            {isLoading ? (
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <Spinner />
                    <span className="mt-2">Loading Profile</span>
                </div>
            ) : (
                <form className="px-4 relative flex-1 flex flex-col h-full" onSubmit={handleSubmit(onSubmit)}>
                    <h1 className="font-bold text-2xl my-4">General Settings</h1>
                    <div className="mt-b">
                        <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">
                            Profile Name*
                        </label>
                        <input  {...register("name")} placeholder="name" className="mt-1 w-full rounded-md shadow-sm border-gray-700 bg-gray-800 text-white sm:text-sm" id="name" type="text" />
                    </div>

                    <h1 className="font-bold text-2xl my-4">Advanced Settings</h1>

                    <div className="mb-4 flex items-center gap-2">
                        <input  {...register("console")} className=" border-gray-700 bg-gray-800 border-2 text-blue-600" id="console" type="checkbox" />
                        <label htmlFor="console">Console</label>
                    </div>

                    <details>
                        <summary className="flex justify-between">
                            <span className="font-bold text-2xl my-4">Mods</span>
                            <button onClick={() => {
                                mutate.mutate({ type: "patch", data: { mods: [] } });
                            }}>Vaildate</button>
                        </summary>
                        <ul>
                            {(mods ?? []).map((mod, i) => (
                                <li key={i} className="flex overflow-hidden py-4 gap-2 items-center">
                                    <div className="w-full">
                                        <h4 className="font-bold">{mod.name}</h4>
                                        <p className="text-sm w-full whitespace-nowrap text-ellipsis overflow-hidden">{mod.version} - {mod.id}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </details>

                    <details className="font-bold text-2xl my-4">
                        <summary>JSON</summary>
                        <pre>
                            <code>
                                {JSON.stringify(defaultValues, undefined, 2)}
                            </code>
                        </pre>
                    </details>

                    <div className="absolute bottom-4 right-4">
                        <button type="submit" title="Save" className="z-30 shadow-2xl text-2xl h-12 w-12 rounded-full hover:bg-green-400 bg-green-500 flex items-center justify-center">
                            <HiSave />
                        </button>
                    </div>
                </form>
            )}
        </main>
    );
}

export default ProfilePage;