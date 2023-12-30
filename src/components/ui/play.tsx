import type { MinecraftProfile } from "@/lib/models/profiles";
import useIsGameRunning from "@hook/useIsGameRunning";
import useRunGame from "@hook/useRunGame";
import { Button, type ButtonProps } from "./button";
import { cn } from "@/lib/utils";
import { useState } from "react";

const PlayButton: React.FC<ButtonProps & { profile: MinecraftProfile }> = ({
  profile,
  className,
  ...props
}) => {
  const [isPreparing, setIsPreparing] = useState(false);
  const { isLoading, state: isRunning } = useIsGameRunning();
  const run = useRunGame();

  const running = isRunning === "Running";

  return (
    <Button
      {...props}
      onClick={() => {
        setIsPreparing(true);
        run(profile).finally(() => setIsPreparing(false));
      }}
      disabled={isLoading || running || isPreparing}
      className={cn(
        {
          "bg-blue-500 hover:bg-blue-500/90 dark:bg-blue-900 dark:text-zinc-50 dark:hover:bg-blue-900/90":
            isPreparing,
          "bg-orange-500 hover:bg-orange-500/90 dark:bg-orange-900 dark:text-zinc-50 dark:hover:bg-orange-900/90":
            running,
        },
        className,
      )}
    >
      {isPreparing ? "Preparing" : running ? "Running" : "Play"}
    </Button>
  );
};

export default PlayButton;
