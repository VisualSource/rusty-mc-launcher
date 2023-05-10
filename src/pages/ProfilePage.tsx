import Spinner from "@/components/Spinner";
import { useProfile } from "@lib/hooks/useProfile";
import { useParams } from "react-router-dom";

const ProfilePage: React.FC = () => {
    const { id } = useParams();
    const { profile, isError, isLoading, error } = useProfile(id);

    return (
        <main className="h-full">
            {isLoading ? (
                <div className="w-full h-full flex flex-col justify-center items-center">
                    <Spinner />
                    <span className="mt-2">Loading Profile</span>
                </div>
            ) : null}
            {isError ? (<div>Failed to load profile!</div>) : null}
            {profile ? (
                <div>
                    <pre>
                        <code>{JSON.stringify(profile, undefined, 2)}</code>
                    </pre>
                </div>
            ) : null}
        </main>
    );
}

export default ProfilePage;