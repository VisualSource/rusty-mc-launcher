import { useAsyncError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

import { TypographyH3 } from "@component/ui/typography";

const ProfileError: React.FC<{ message?: string }> = ({ message }) => {
  const error = useAsyncError();

  return (
    <div className="flex h-full flex-col items-center justify-center text-zinc-50">
      <AlertTriangle />
      <TypographyH3>Something went wrong:</TypographyH3>
      <pre className="text-red-300">{(error as Error)?.message ?? message}</pre>
    </div>
  );
};

export default ProfileError;
