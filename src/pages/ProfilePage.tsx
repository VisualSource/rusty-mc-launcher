import Spinner from "@/components/Spinner";
import { useProfile } from "@lib/hooks/useProfile";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";

const ProfilePage: React.FC = () => {
    const { id } = useParams();
    const { handleSubmit } = useForm();
    const { profile, isError, isLoading, error } = useProfile(id);

    const submit = () => { }

    return (
        <main className="h-full px-2 pt-4 overflow-y-scroll">
            {isLoading ? (
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <Spinner />
                    <span className="mt-2">Loading Profile</span>
                </div>
            ) : null}
            {isError ? (<div>Failed to load profile!</div>) : null}
            {profile ? (
                <form onSubmit={handleSubmit(submit)} className="px-4">
                    <h1 className="font-bold text-2xl my-4">General Settings</h1>
                    <div className="mt-b">
                        <label htmlFor="name" className="block text-xs font-medium text-gray-700 dark:text-gray-200">
                            Profile Name*
                        </label>
                        <input defaultValue={profile.name} placeholder="name" className="mt-1 w-full rounded-md shadow-sm border-gray-700 bg-gray-800 text-white sm:text-sm" id="name" type="text" />
                    </div>

                    <h1 className="font-bold text-2xl my-4">Advanced Settings</h1>

                    <div className="mb-4">
                        <label htmlFor="console">Console</label>
                        <input className=" border-gray-700 bg-gray-800 border-2 text-blue-600" id="console" type="checkbox" defaultChecked={profile.console} />
                    </div>

                    <h1 className="font-bold text-2xl my-4">Mods</h1>

                    <ul>
                        {(profile.mods ?? []).map((mod, i) => (
                            <li key={i} id={mod.id}>{mod.name} - {mod.version}</li>
                        ))}
                    </ul>

                </form>
            ) : null}
        </main>
    );
}

export default ProfilePage;