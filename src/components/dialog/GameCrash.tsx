import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCrashEvent } from "@/hooks/useProcessState";

const GameCrash: React.FC = () => {
	const [exitCode, setExitCode] = useState(1);
	const [open, setOpen] = useState(false);

	useCrashEvent((ev) => {
		setExitCode(ev.detail.code);
		setOpen(true);
	});

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent className="text-zinc-50">
				<AlertDialogHeader>
					<AlertDialogTitle>Crash Notice</AlertDialogTitle>
					<AlertDialogDescription className="text-center p-4">
						The game did not exit successfully. (Exit Code: {exitCode})
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
