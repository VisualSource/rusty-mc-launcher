import { DatabaseZap, Download, Play, StopCircle } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

import type { AuthenticationResultExtended } from "@/lib/auth/msal";
import { stop, launchGame } from "@/lib/api/plugins/game";
import { useIsRunning } from "@/hooks/useProcessState";
import { Button, type buttonVariants } from "./button";
import type { Profile } from "@/lib/models/profiles";
import { queryClient } from "@/lib/api/queryClient";
import { toastAwaitProimse } from "@/lib/toast";
import { KEY_PROFILE } from "@/hooks/keys";
import useUser from "@/hooks/useUser";
import { cn } from "@/lib/utils";

type Props = VariantProps<typeof buttonVariants> &
	Omit<React.ComponentProps<"button">, "disabled"> & {
		profile: Pick<Profile, "id" | "state">;
	};

const DisplayState: React.FC<{
	isRunning: boolean;
	state: Profile["state"];
}> = ({ state, isRunning }) => {
	switch (state) {
		case "UNINSTALLED":
			return (
				<span className="inline-flex items-center justify-center">
					<Download className="mr-1 h-5 w-5" /> Install
				</span>
			);
		case "INSTALLING":
			return (
				<span className="inline-flex animate-pulse items-center justify-center">
					<DatabaseZap className="mr-1 h-5 w-5 animate-bounce" /> Installing...
				</span>
			);
		case "INSTALLED":
			if (isRunning)
				return (
					<span className="inline-flex items-center justify-center">
						<StopCircle className="mr-1 h-5 w-5" /> Stop
					</span>
				);
			return (
				<span className="inline-flex items-center justify-center">
					<Play className="mr-1 h-5 w-5" /> Play
				</span>
			);
		default:
			return null;
	}
};

const PlayButton: React.FC<Props> = ({ profile, className, ...props }) => {
	const { acquireToken } = useUser();
	const isRunning = useIsRunning(profile.id);

	return (
		<Button
			{...props}
			onClick={async () => {
				if (isRunning) {
					await stop(profile.id).catch((e) => {
						console.error(e);
					});
					return;
				}
				try {
					const result =
						(await acquireToken()) as AuthenticationResultExtended | null;
					if (!result) throw new Error("Failed to get token");
					const accessToken = result.tokens.mcAccessToken;
					if (!accessToken) throw new Error("Missing token");
					if (
						!result.account.name ||
						!result.account.id ||
						!result.account.xuid
					)
						throw new Error("Missing launch params");

					await toastAwaitProimse(
						launchGame({
							auth_access_token: accessToken,
							auth_player_name: result.account.name,
							auth_uuid: result.account.id,
							auth_xuid: result.account?.xuid,
							profile_id: profile.id,
						}).then(() =>
							queryClient.invalidateQueries({
								queryKey: [KEY_PROFILE, profile.id],
							}),
						),
						{
							loading: "Starting Minecraft",
							success: {
								title: "Launched Minecraft",
							},
							error: "Failed to start",
						},
					);
				} catch (error) {
					console.error(error);
				}
			}}
			disabled={profile.state === "INSTALLING"}
			className={cn(
				"cursor-pointer",
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
