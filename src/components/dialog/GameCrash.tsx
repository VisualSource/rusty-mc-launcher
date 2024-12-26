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
	const [data, setData] = useState<{ open: boolean, code: number; details: string }>({ open: false, code: 0, details: "" });

	useCrashEvent((ev) => {
		setData({ open: true, details: ev.detail.details, code: ev.detail.code })
	});

	return (
		<AlertDialog open={data.open} onOpenChange={(data) => setData(pre => ({ ...pre, open: data }))}>
			<AlertDialogContent className="text-zinc-50">
				<AlertDialogHeader>
					<AlertDialogTitle>Crash Notice</AlertDialogTitle>
					<AlertDialogDescription className="text-center p-4">
						The game did not exit successfully. (Exit Code: {data.code})
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="overflow-hidden max-h-44 scrollbar">
					{data.details.length ? (
						<div className="px-1 py-2 overflow-scroll bg-gray-400 rounded-md max-h-36">
							<pre>
								<code className="text-xs text-inherit">{data.details}</code>
							</pre>
						</div>
					) : null}
				</div>
				<AlertDialogFooter>
					<AlertDialogAction>Ok</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default GameCrash;
