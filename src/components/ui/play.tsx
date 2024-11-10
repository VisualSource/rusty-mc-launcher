import { DatabaseZap, Download, Play, StopCircle } from "lucide-react";
import { exit } from "@tauri-apps/plugin-process";
import { toast } from "react-toastify";
import { stop, launchGame } from "@/lib/api/plugins/game";
import type { Profile } from "@/lib/models/profiles";
import useIsGameRunning from "@hook/useIsGameRunning";
import { Button, type ButtonProps } from "./button";
import { isOption } from "@/lib/models/settings";
import useUser from "@/hooks/useUser";
import logger from "@system/logger";
import { cn } from "@/lib/utils";

const DisplayState: React.FC<{ isRunning: boolean, state: Profile["state"] }> = ({ state, isRunning }) => {
	switch (state) {
		case "UNINSTALLED":
			return (
				<span className="inline-flex">
					<Download className="mr-1 h-5 w-5" /> Install
				</span>
			);
		case "INSTALLING":
			return (
				<span className="inline-flex animate-pulse">
					<DatabaseZap className="mr-1 h-5 w-5 animate-bounce" /> Installing...
				</span>
			);
		case "INSTALLED":
			if (isRunning) return (
				<span className="inline-flex">
					<StopCircle className="mr-1 h-5 w-5" /> Stop
				</span>
			);
			return (
				<span className="inline-flex">
					<Play className="mr-1 h-5 w-5" /> Play
				</span>
			);
		default:
			return null;
	}
}

const PlayButton: React.FC<
	ButtonProps & { profile: Pick<Profile, "id" | "state"> }
> = ({ profile, className, ...props }) => {
	const user = useUser();

	const { isLoading, state: isRunning } = useIsGameRunning({
		profile: profile.id,
	});

	return (
		<Button
			{...props}
			onClick={async () => {
				if (isRunning) {
					await stop(profile.id);
					return;
				}

				let exitTimer: ReturnType<typeof setTimeout> | undefined;
				try {
					if (!user.account) return;
					await launchGame({
						auth_access_token: user.account?.token.access_token,
						auth_player_name: user.account?.details.name,
						auth_uuid: user.account?.details.id,
						auth_xuid: user.account?.xuid,
						profile_id: profile.id,
					});

					const exit_on_start = await isOption("option.exit_on_start", "TRUE");
					if (exit_on_start) {
						exitTimer = setTimeout(() => exit(0), 12_000);
					}
				} catch (error) {
					logger.error((error as Error).message);
					toast.error("Failed to start minecraft", {
						data: error,
					});
					clearTimeout(exitTimer);
				}
			}}
			disabled={isLoading || profile.state === "INSTALLING"}
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
			<DisplayState state={profile.state} isRunning={isRunning} />
		</Button>
	);
};

export default PlayButton;
