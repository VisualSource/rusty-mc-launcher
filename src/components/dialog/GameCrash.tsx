import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CRASH_EVENT = "rmcl://process-crash";

const GameCrash: React.FC = () => {
	const [exitCode, setExitCode] = useState(1);
	const [open, setOpen] = useState(false);

	useEffect(() => {
		const eventHandler = listen<string>(CRASH_EVENT, (ev) => {
			try {
				const data = JSON.parse(ev.payload) as { status: number };
				setExitCode(data.status);
				setOpen(true);
			} catch (error) {
				console.error(error);
			}
		});

		return () => {
			eventHandler.then((unsub) => unsub());
		};
	}, []);

	return (
		<AlertDialog open={open} onOpenChange={setOpen}>
			<AlertDialogContent className="text-zinc-50">
				<AlertDialogHeader>
					<AlertDialogTitle>Crash Notice</AlertDialogTitle>
					<AlertDialogDescription className="text-center p-4">
						The game did not start/exit successfully. (Exit Code: {exitCode})
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
