import { DatabaseZap, Download, Play, StopCircle } from "lucide-react";
import { exit } from "@tauri-apps/api/process";
import { toast } from "react-toastify";

import type { MinecraftProfile } from "@/lib/models/profiles";
import { launchGame, stop } from "@/lib/system/commands";
import useIsGameRunning from "@hook/useIsGameRunning";
import { Button, type ButtonProps } from "./button";
import { settings } from "@/lib/models/settings";
import useUser from "@/hooks/useUser";
import logger from "@system/logger";
import { cn } from "@/lib/utils";

const PlayButton: React.FC<
	ButtonProps & { profile: Pick<MinecraftProfile, "id" | "state"> }
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

				let exitTimer;
				try {
					if (!user.account) return;
					await launchGame({
						auth_access_token: user.account?.token.access_token,
						auth_player_name: user.account?.details.name,
						auth_uuid: user.account?.details.id,
						auth_xuid: user.account?.xuid,
						profile_id: profile.id,
					});

					const exit_on_start = await settings.is_true("option.exit_on_start");
					if (exit_on_start) {
						exitTimer = setTimeout(() => exit(0), 12_000);
					}
				} catch (error) {
					logger.error((error as Error).message);
					toast.error("Failed to launch game!", {
						data: { error: (error as Error).message },
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
