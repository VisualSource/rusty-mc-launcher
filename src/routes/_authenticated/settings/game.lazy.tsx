import { createLazyFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import {
	Setting,
	isOption,
	updateConfig,
	addConfig,
} from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loading } from "@/components/Loading";

const OPTION_EXIT_ON_START = "option.exit_on_start";

export const Route = createLazyFileRoute("/_authenticated/settings/game")({
	component: GameSettings,
	pendingComponent: Loading,
});

function GameSettings() {
	const form = useForm<{ exit_on_start: boolean }>({
		async defaultValues() {
			try {
				const exit_on_start = await isOption(OPTION_EXIT_ON_START, "TRUE");

				return { exit_on_start };
			} catch (error) {
				return { exit_on_start: false };
			}
		},
	});

	const onSubmit = async (state: { exit_on_start: boolean }) => {
		const [affected] = await updateConfig(
			OPTION_EXIT_ON_START,
			state.exit_on_start ? "TRUE" : "FALSE",
		);
		if (affected === 0) {
			await addConfig(
				OPTION_EXIT_ON_START,
				state.exit_on_start ? "TRUE" : "FALSE",
			);
		}

		toast.success("Settings saved");
	};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">Game</h3>
				<p className="text-sm text-muted-foreground">
					Edit game settings.
				</p>
			</div>
			<Separator />
			<div className="space-y-4">
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="mt-4 space-y-2"
					>
						<FormField
							control={form.control}
							name="exit_on_start"
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

						<div className="flex w-full justify-end">
							<Button type="submit">Save</Button>
						</div>
					</form>
				</Form>
			</div>
		</div>
	);
}
