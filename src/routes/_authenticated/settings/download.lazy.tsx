import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { exists, readDir } from "@tauri-apps/plugin-fs";
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
import { getConfig, updateConfig } from "@/lib/models/settings";
import { Separator } from "@/components/ui/separator";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Input } from "@/components/ui/input";

const JavaJREForamt =
	/zulu(?<zulu>\d+\.\d+\.\d+)-ca-jre(?<jre>\d+\.\d+\.\d+)-(?<platform>\w+)/;

const OPTION_PATH_APP = "path.app";
const APLICATION_RUNTIMES_AND_VERSIONS = "APPLICATION_RUNTIMES_AND_VERSIONS";

export const Route = createLazyFileRoute("/_authenticated/settings/download")({
	component: DownloadSettings,
	pendingComponent: Loading,
});

function DownloadSettings() {
	const { data } = useSuspenseQuery({
		queryKey: [APLICATION_RUNTIMES_AND_VERSIONS],
		queryFn: async () => {
			const path = await getConfig(OPTION_PATH_APP);
			if (!path) return { java: [], versions: [] };
			const runtime_dir = await join(path.value, "runtime");

			const [versions, java] = await Promise.all([
				join(runtime_dir, "versions").then((dir) => readDir(dir)),
				join(runtime_dir, "java")
					.then((dir) => readDir(dir))
					.then((dirs) =>
						dirs.map((dir) => {
							const match = dir.name.match(JavaJREForamt);
							if (!match) {
								return {
									name: dir.name,
									folder: dir.name,
								};
							}

							const zuluBuild = match.groups?.zulu ?? "Unknown";
							const jre = match.groups?.jre ?? "Unknown";
							const platform = match.groups?.platform ?? "Unknown";

							return {
								name: `Java ${jre} for ${platform}. (Zulu ${zuluBuild})`,
								folder: dir.name,
							};
						}),
					),
			]);

			return {
				java,
				versions,
			};
		},
	});
	const form = useForm<{ dir: string }>({
		async defaultValues() {
			const paths = await getConfig(OPTION_PATH_APP);
			const path = paths?.value;
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

		await updateConfig(OPTION_PATH_APP, state.dir);
		await queryClient.invalidateQueries({
			queryKey: [APLICATION_RUNTIMES_AND_VERSIONS],
		});
	};

	return (
		<div className="space-y-6">
			<div>
				<h2 className="text-xl font-medium">Downloads</h2>
				<p className="text-sm text-muted-foreground">
					Install directory's and versions.
				</p>
			</div>
			<Separator />
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
										The directory where all files are put. Ex. profile, and game
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
			</div>

			<section>
				<h3 className="text-lg font-medium">Minecraft Instances</h3>
				<p className="mt-0 text-muted-foreground text-sm">
					All installed versions of minecraft.
				</p>
				<ul className="w-full max-h-32 overflow-y-scroll divide-y">
					{data.versions.map((version, key) => (
						<li
							className="hover:bg-gray-300/10"
							key={`${version.name}_${key + 1}`}
						>
							<button type="button" className="p-2 w-full text-left">
								{version.name}
							</button>
						</li>
					))}
				</ul>
			</section>

			<section>
				<h3 className="text-lg font-medium">Java Runtimes</h3>
				<p className="mt-0 text-muted-foreground text-sm">
					All installed java versions.
				</p>
				<ul className="w-full max-h-32 overflow-y-scroll divide-y">
					{data.java.map((version, key) => (
						<li
							className="hover:bg-gray-300/10"
							key={`${version.name}_${key + 1}`}
						>
							<button type="button" className="p-2 w-full text-left">
								{version.name}
							</button>
						</li>
					))}
				</ul>
			</section>
		</div>
	);
}
