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
} from "../ui/form";
import { settings } from "@/lib/models/settings";
import { TypographyH3 } from "../ui/typography";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";

export const LaunchSettings: React.FC = () => {
	const form = useForm<{ exit_on_start: boolean }>({
		async defaultValues() {
			try {
				const exit_on_start = await settings.get_setting(
					"option.exit_on_start",
				);

				return { exit_on_start: exit_on_start.value === "TRUE" };
			} catch (error) {
				return { exit_on_start: false };
			}
		},
	});

	const onSubmit = async (state: { exit_on_start: boolean }) => {
		const [affected] = await settings.update(
			"option.exit_on_start",
			state.exit_on_start ? "TRUE" : "FALSE",
		);
		if (affected === 0) {
			await settings.insert(
				"option.exit_on_start",
				state.exit_on_start ? "TRUE" : "FALSE",
			);
		}

		toast.success("Settings saved");
	};

	return (
		<>
			<TypographyH3>Launch Settings</TypographyH3>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-2">
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
									If on game launch exit the launcher.
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
		</>
	);
};
