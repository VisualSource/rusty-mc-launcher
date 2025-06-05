import { millisecondsToMinutes, minutesToMilliseconds } from "date-fns";
import { createLazyFileRoute } from "@tanstack/react-router";
import { open } from "@tauri-apps/plugin-dialog";
import { CopyX, FolderCog } from "lucide-react";
import { exists } from "@tauri-apps/plugin-fs";
import { useForm } from "react-hook-form";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { isOption, getConfig, upsert } from "@/lib/models/settings";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { toastSuccess } from "@/lib/toast";

type State = { exitOnStart: boolean; copyOptionsFrom?: string, maxLaunchWait?: number };

const OPTION_EXIT_ON_START = "option.exit_on_start";
const OPTION_COPY_SETTINGS = "option.copy_settings_from";
const OPTION_MAX_LAUNCH_WAIT = "option.max_launch_wait";

const selectFile = async () => {
	const selected = await open({
		multiple: false,
		title: "Select File",
		filters: [
			{
				name: "Options",
				extensions: ["txt"],
			},
		],
	});

	if (!selected) return;
	const isFile = await exists(selected);
	if (!isFile) throw new Error("The provided file does not exist");

	return selected;
};

export const Route = createLazyFileRoute("/_authenticated/settings/game")({
	component: GameSettings,
	pendingComponent: Loading,
});

function GameSettings() {
	const form = useForm<State>({
		async defaultValues() {
			try {
				const [exitOnStart, copyOptionsFrom, maxLaunchWait] = await Promise.all([
					isOption(OPTION_EXIT_ON_START, "TRUE"),
					getConfig(OPTION_COPY_SETTINGS).then((e) => e?.value),
					getConfig(OPTION_MAX_LAUNCH_WAIT).then(e => {
						if (!e?.value) return;
						const ticks = Number.parseInt(e.value);
						return millisecondsToMinutes(ticks * 250);
					})
				]);

				return { exitOnStart, copyOptionsFrom, maxLaunchWait };
			} catch (error) {
				return { exitOnStart: false };
			}
		},
	});

	const onSubmit = async (state: State) => {
		await upsert(OPTION_EXIT_ON_START, state.exitOnStart ? "TRUE" : "FALSE");

		if (state.copyOptionsFrom) {
			await upsert(OPTION_COPY_SETTINGS, state.copyOptionsFrom);
		}

		if (state.maxLaunchWait) {
			const ticks = minutesToMilliseconds(state.maxLaunchWait) / 250;
			await upsert(OPTION_MAX_LAUNCH_WAIT, ticks);
		}

		toastSuccess({ title: "Settings Saved" });
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Game</h3>
				<p className="text-sm text-muted-foreground">Edit game settings.</p>
			</div>
			<Separator />
			<div className="space-y-4">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="mt-4 space-y-4"
					>
						<FormField
							name="copyOptionsFrom"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<div className="flex-col gap-2 flex">
										<FormLabel>Copy Options From</FormLabel>
										<FormControl>
											<div className="flex gap-2">
												<Input placeholder="C:\.minecraft\options.txt" readOnly value={field.value} />
												<Button
													title="Open"
													type="button"
													onClick={() =>
														selectFile().then((e) => {
															field.onChange(e);
														})
													}
												>
													<FolderCog />
												</Button>
												<Button
													title="Clear"
													variant="destructive"
													type="button"
													onClick={() => field.onChange(undefined)}
												>
													<CopyX />
												</Button>
											</div>
										</FormControl>
									</div>
									<FormDescription>
										Use the game settings from a installed game instance for
										newly created profiles.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="exitOnStart"
							control={form.control}
							render={({ field }) => (
								<FormItem>
									<div className="flex flex-row-reverse items-center justify-end gap-2">
										<FormLabel>Exit on game start</FormLabel>
										<FormControl>
											<Switch
												checked={field.value}
												onCheckedChange={(ev) => field.onChange(ev)}
											/>
										</FormControl>
									</div>
									<FormDescription>
										Control if the launcher exits on game start.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField name="maxLaunchWait" control={form.control} rules={{
							min: { message: "Min wait time is a 1min", value: 1 },
							max: { message: "Outside the max wait time", value: 30 },
						}} render={({ field }) => (
							<FormItem>
								<FormLabel>Max Launch Wait</FormLabel>
								<FormControl>
									<Input placeholder="1 minute" {...field} type="number" step="1" />
								</FormControl>
								<FormDescription>
									The max amount of time the launcher will wait for minecraft to launch. (Default 1 minute)
								</FormDescription>
								<FormMessage />
							</FormItem>
						)} />

						<div className="flex w-full justify-end">
							<Button type="submit">Save</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}
