import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { exists, readDir } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";
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
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/api/queryClient";
import { settings } from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const APP_INSTALLED_MC_VERIONS = "APPLICATION_INSTALLED_MC_VERSIONS";
export const Route = createLazyFileRoute("/_authenticated/settings/download")({
	component: DownloadSettings,
	pendingComponent: Loading,
});

function DownloadSettings() {
	const { data } = useSuspenseQuery({
		queryKey: [APP_INSTALLED_MC_VERIONS],
		queryFn: async () => {
			const path = await settings.get_setting("path.app");
			if (!path) return [];
			const version_dir = await join(path.value, "runtime", "versions");
			return readDir(version_dir);
		},
	});
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
		await queryClient.invalidateQueries({
			queryKey: [APP_INSTALLED_MC_VERIONS],
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-medium">Download</h2>
				<p className="text-sm text-muted-foreground">
					Modify download settings.
				</p>
			</div>
			<Separator />
			<h3 className="mb-4 text-lg font-medium">General</h3>
			<div>
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
					<Button disabled type="button">
						Clear
					</Button>
				</div>
			</div>

			<h3 className="text-lg font-medium">Minecraft Instances</h3>
			<p className="mt-0 text-muted-foreground text-sm">
				The localy installed versions of minecraft
			</p>
			<div>
				<table className="w-full">
					<thead className="border-b">
						<tr>
							<th>Version</th>
							<th>Location</th>
						</tr>
					</thead>
					<tbody className="divide-y">
						{data.map((version, key) => (
							<tr key={`${version.name}_${key + 1}`}>
								<td className="text-nowrap text-center p-2 border-r">
									{version.name}
								</td>
								<td className="text-center p-2 text-sm text-muted-foreground">
									{version.path}
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
