import { useAsyncError } from "react-router-dom";

const ProfileError: React.FC = () => {
    const error = useAsyncError();

    return (
        <div>{(error as Error).message}</div>
    );
}

export default ProfileError;