import { AlertTriangleIcon } from "lucide-react";
import { useAsyncError } from "react-router-dom";

import { TypographyH3 } from "@component/ui/typography";

const ProfileError: React.FC<{ message?: string }> = ({ message }) => {
  const error = useAsyncError();
  return (
    <div className="flex h-full flex-col items-center justify-center text-zinc-50">
      <AlertTriangleIcon className="h-14 w-14" />
      <TypographyH3>
        {(error as Error)?.message ?? message ?? "There was an error."}
      </TypographyH3>
    </div>
  );
};

export default ProfileError;
