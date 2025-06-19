import { Suspense, useState } from "react";
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
import { useSuspenseQuery } from "@tanstack/react-query";
import { query } from "@/lib/api/plugins/query";
import { join } from "@tauri-apps/api/path";
import { readTextFile } from "@tauri-apps/plugin-fs";
import { ErrorBoundary } from "react-error-boundary";
import { Loading } from "../Loading";

const ProfileLog: React.FC<{ profileId: string }> = ({ profileId }) => {
	const { data } = useSuspenseQuery({
		queryKey: ["log-latest", profileId],
		queryFn: async () => {
			if (!profileId.length) return "";

			const app = await query`SELECT value FROM settings WHERE key = 'path.app';`.get();
			if (!app?.value || typeof app.value !== "string") throw new Error("Failed to get 'path.app' setting");

			const logFile = await join(app.value, "profiles", profileId, "logs/latest.log");

			const content = await readTextFile(logFile);

			return content;
		}
	});

	return (
		<pre>
			<code className="text-xs text-inherit overflow-scroll">{data}</code>
		</pre>
	);
}

const GameCrash: React.FC = () => {
	const [data, setData] = useState<{
		open: boolean;
		code: number;
		profile: string;
		details: string;
	}>({ open: false, code: 0, details: "", profile: "" });

	useCrashEvent((ev) => {
		setData({ open: true, ...ev.detail });
	});

	return (
		<AlertDialog
			open={data.open}
			onOpenChange={(data) => setData((pre) => ({ ...pre, open: data }))}
		>
			<AlertDialogContent className="text-zinc-50">
				<AlertDialogHeader>
					<AlertDialogTitle>Crash Notice</AlertDialogTitle>
					<AlertDialogDescription className="text-center p-4">
						{data.details.length ? data.details : "The game did not exit successfully."} (Exit Code: {data.code})
					</AlertDialogDescription>
				</AlertDialogHeader>
				<div className="max-h-60 scrollbar overflow-scroll px-1 py-2 rounded-lg bg-accent">
					<ErrorBoundary fallback={<div>Failed to load log file.</div>}>
						<Suspense fallback={<Loading />}>
							<ProfileLog profileId={data.profile} />
						</Suspense>
					</ErrorBoundary>
				</div>
				<AlertDialogFooter>
					<AlertDialogAction>Ok</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
};

export default GameCrash;
