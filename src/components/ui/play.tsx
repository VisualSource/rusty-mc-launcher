import { DatabaseZap, Download, Play, StopCircle } from "lucide-react";

import type { MinecraftProfile } from "@/lib/models/profiles";
import useIsGameRunning from "@hook/useIsGameRunning";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";

const PlayButton: React.FC<
  ButtonProps & { profile: Pick<MinecraftProfile, "id" | "state"> }
> = ({ profile, className, ...props }) => {
  const { isLoading, state: isRunning } = useIsGameRunning({
    profile: profile.id,
  });

  return (
    <Button
      {...props}
      onClick={() => {}}
      disabled={isLoading || isRunning || profile.state === "INSTALLING"}
      className={cn(
        {
          "bg-blue-500 hover:bg-blue-500/90 dark:bg-blue-900 dark:text-zinc-50 dark:hover:bg-blue-900/90":
            isRunning,
          "bg-green-500 hover:bg-green-500/90 dark:bg-green-900 dark:text-zinc-50 dark:hover:bg-green-900/90":
            profile.state === "INSTALLING",
        },
        className,
      )}
    >
      {profile.state === "INSTALLED" && !isRunning ? (
        <>
          {" "}
          <Play className="mr-1 h-5 w-5" /> Play
        </>
      ) : null}
      {profile.state === "INSTALLED" && isRunning ? (
        <>
          {" "}
          <StopCircle className="mr-1 h-5 w-5" /> Stop
        </>
      ) : null}
      {profile.state === "INSTALLING" ? (
        <span className="inline-flex animate-pulse">
          <DatabaseZap className="mr-1 h-5 w-5 animate-bounce" /> Installing...
        </span>
      ) : null}
      {profile.state === "UNINSTALLED" ? (
        <>
          <Download className="mr-1 h-5 w-5" /> Install
        </>
      ) : null}
    </Button>
  );
};

export default PlayButton;
