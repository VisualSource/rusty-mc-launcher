import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEffect, useState } from "react";

const KEY = "mcl::game-exit-status";

const GameCrash: React.FC = () => {
  const [exitCode, setExitCode] = useState(1);
  const [exitMessage, setExitMessage] = useState<string>();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (ev: Event) => {
      const data = (ev as CustomEvent<{ exitCode: number; msg?: string }>)
        .detail;
      setExitCode(data.exitCode);
      setExitMessage(data?.msg);
      setOpen(true);
    };
    window.addEventListener(KEY, handler, { passive: true });
    return () => window.removeEventListener(KEY, handler);
  }, []);

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogContent className="text-zinc-50">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {!exitMessage ? "Game Crash" : "Failed To Start"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {!exitMessage
              ? `The game did not exit successfully. (Exit Code: ${exitCode})`
              : `Error starting game: ${exitMessage}`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction>Ok</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default GameCrash;
