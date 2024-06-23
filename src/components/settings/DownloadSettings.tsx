import { exists } from "@tauri-apps/api/fs";
import { useForm } from "react-hook-form";

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
import { Input } from "../ui/input";
import { Label } from "../ui/label";

export const DownloadSettings: React.FC = () => {
	const form = useForm<{ dir: string }>({
		async defaultValues() {
			const paths = await settings.select("path.app");
			const path = paths.at(0)?.value;
			if (!path) throw new Error("Failed to get dir");
			return { dir: path };
		},
	});

	const onSubmit = async (state: { dir: string }) => {
		if (!(await exists(state.dir))) {
			form.setError("dir", {
				type: "validate",
				message: "The new path does not exist.",
			});
			return;
		}

		await settings.update("path.app", state.dir);
	};

	return (
		<>
			<TypographyH3>Download Settings</TypographyH3>

			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
					<FormField
						rules={{
							required: {
								message: "The app directory is required",
								value: true,
							},
						}}
						control={form.control}
						name="dir"
						render={({ field }) => (
							<FormItem>
								<FormLabel>App Directory</FormLabel>
								<FormControl>
									<Input {...field} placeholder="app directory" />
								</FormControl>
								<FormDescription>
									The directory where all file are put. Ex. profile, and game
									runtime files.
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
			<div className="flex flex-col">
				<Label className="mb-4">Clear Cached Images</Label>
				<Button type="button">Clear</Button>
			</div>
		</>
	);
};
