import { createLazyFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { exists, readDir } from "@tauri-apps/plugin-fs";
import { error } from "@tauri-apps/plugin-log";
import { join } from "@tauri-apps/api/path";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";

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
import { checkForAppUpdate } from "@/lib/system/updateCheck";
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

const UpdateCheckBtn: React.FC = () => {
	const [isChecking, setIsChecking] = useState(false);

	return (
		<Button
			disabled={isChecking}
			className="w-full"
			variant="outline"
			onClick={() => {
				setIsChecking(true);
				checkForAppUpdate(true)
					.catch((e) => {
						if (e instanceof Error) error(e.message);
						console.error(e);
					})
					.finally(() => setIsChecking(false));
			}}
		>
			{isChecking ? (
				<span className="inline-flex gap-2 items-center">
					Looking for updates <Loader2 className="animate-spin" />
				</span>
			) : (
				<span>Check for updates</span>
			)}
		</Button>
	);
};

const getVersions = async (runtimeDir: string) => {
	const dir = await join(runtimeDir, "versions");
	const doesExist = await exists(dir);
	if (!doesExist) return [];
	return readDir(dir);
}

const getInstalledJREs = async (runtimeDir: string) => {
	const dir = await join(runtimeDir, "java");
	const doesExist = await exists(dir);
	if (!doesExist) return [];

	const folders = await readDir(dir);

	const versions = [];
	for (const folder of folders) {
		const match = folder.name.match(JavaJREForamt);
		if (!match) {
			versions.push({ name: folder.name, folder: folder.name })
			continue;
		};

		const zuluBuild = match.groups?.zulu ?? "Unknown";
		const jre = match.groups?.jre ?? "Unknown";
		const platform = match.groups?.platform ?? "Unknown";

		versions.push({
			name: `Java ${jre} for ${platform}. (Zulu ${zuluBuild})`,
			folder: folder.name,
		})
	}

	return versions;
}

function DownloadSettings() {
	const { data } = useSuspenseQuery({
		queryKey: [APLICATION_RUNTIMES_AND_VERSIONS],
		queryFn: async () => {
			const path = await getConfig(OPTION_PATH_APP);
			if (!path) return { java: [], versions: [] };
			const runtime_dir = await join(path.value, "runtime");
			const [versions, java] = await Promise.all([
				getVersions(runtime_dir),
				getInstalledJREs(runtime_dir),
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

			<div className="w-full">
				<UpdateCheckBtn />
			</div>

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
