import { AlertTriangleIcon } from "lucide-react";
import { useAsyncError } from "react-router-dom";
import { TypographyH3 } from "../ui/typography";

const ProfileError: React.FC = () => {
  const error = useAsyncError();

  return (
    <div className="text-zinc-50 flex flex-col h-full justify-center items-center">
      <AlertTriangleIcon className="h-14 w-14" />
      <TypographyH3>
        {(error as Error)?.message ?? "There was an error."}
      </TypographyH3>
    </div>
  );
};

export default ProfileError;
