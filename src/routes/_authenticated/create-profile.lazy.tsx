import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Book } from "lucide-react";

import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@component/ui/form";
import { ProfileVersionSelector } from "@/components/library/content/profile/ProfileVersionSelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNCATEGORIZEDP_GUID } from "@/lib/models/categories";
import type { MinecraftProfile } from "@lib/models/profiles";
import { createProfile, db } from "@/lib/system/commands";
import { TypographyH3 } from "@/components/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { queryClient } from "@/lib/api/queryClient";
import { Button } from "@/components/ui/button";
import { profile } from "@lib/models/profiles";
import { Input } from "@/components/ui/input";
import { CATEGORY_KEY } from "@/hooks/keys";
import logger from "@/lib/system/logger";

export const Route = createLazyFileRoute("/_authenticated/create-profile")({
	component: CreateProfile,
});

const resolver = zodResolver(profile.schema);

function CreateProfile() {
	const navigate = useNavigate();
	const form = useForm<MinecraftProfile>({
		resolver,
		defaultValues: {
			id: crypto.randomUUID(),
			name: "New Profile",
			version: "latest-release",
			loader: "vanilla",
			java_args:
				"-Xmx2G -XX:+UnlockExperimentalVMOptions -XX:+UseG1GC -XX:G1NewSizePercent=20 -XX:G1ReservePercent=20 -XX:MaxGCPauseMillis=50 -XX:G1HeapRegionSize=32M",
			date_created: new Date().toISOString(),
		},
	});

	const onSubmit = async (ev: MinecraftProfile) => {
		try {
			const queue_id = crypto.randomUUID();

			let version = ev.version;
			if (ev.version === "latest-release") {
				const latest_data = (await fetch(
					"https://launchermeta.mojang.com/mc/game/version_manifest_v2.json",
				).then((e) => e.json())) as {
					latest: { release: string; snapshot: string };
				};
				version = latest_data.latest.release;
			}

			await db.execute({
				query: `BEGIN TRANSACTION;
					INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?);
					INSERT INTO download_queue VALUES (?,?,
					(SELECT COUNT(*) as count FROM download_queue WHERE state = 'PENDING'),
					?,?,?,?,?,?,?);
				COMMIT;`,
				args: [
					ev.id,
					ev.name,
					ev.icon ?? null,
					ev.date_created,
					ev.last_played ?? null,
					version,
					ev.loader,
					ev.loader_version ?? null,
					ev.java_args ?? null,
					ev.resolution_width ?? null,
					ev.resolution_height ?? null,
					"INSTALLING",
					queue_id,
					1,
					`Minecraft ${version} ${ev.loader}`,
					null,
					ev.id,
					new Date().toISOString(),
					"Client",
					JSON.stringify({
						version: version,
						loader: ev.loader.replace(/^\w/, ev.loader[0].toUpperCase()),
						loader_version: ev.loader_version,
					}),
					"PENDING",
				],
			});

			await createProfile(ev.id);

			await queryClient.invalidateQueries({
				queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID],
			});

			await navigate({
				to: "/profile/$id",
				params: {
					id: ev.id,
				},
			});
		} catch (error) {
			toast.error("Failed to create profile", { data: { error } });
			logger.error(error);
		}
	};

	return (
		<ScrollArea>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="container flex h-full flex-col space-y-8 py-4 text-zinc-50"
				>
					<section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
						<TypographyH3>Profile Settings</TypographyH3>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Profile Name</FormLabel>
									<FormControl>
										<Input
											autoComplete="false"
											placeholder="Minecraft 1.20"
											value={field.value}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormDescription>
										The name used for this profile.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							name="icon"
							control={form.control}
							render={({ field }) => (
								<FormItem className="flex flex-col">
									<FormLabel>Profile Icon</FormLabel>
									<FormControl>
										<div className="flex items-center gap-2">
											<Avatar>
												<AvatarFallback>
													<Book className="h-4 w-4" />
												</AvatarFallback>
												<AvatarImage src={field.value ?? undefined} />
											</Avatar>
											<Input
												value={field.value ?? ""}
												onChange={field.onChange}
											/>
										</div>
									</FormControl>
									<FormDescription>
										The icon used for this profile.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>

						<ProfileVersionSelector form={form} />
					</section>

					<section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
						<TypographyH3>Game Settings</TypographyH3>

						<FormField
							name="resolution_width"
							control={form.control}
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Window Width</FormLabel>
										<FormDescription>
											The width of the game window when launched.
										</FormDescription>
									</div>
									<FormControl>
										<Input
											placeholder="854"
											value={field.value ?? undefined}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							name="resolution_height"
							control={form.control}
							render={({ field }) => (
								<FormItem className="flex flex-row items-center justify-between p-3 shadow-sm">
									<div className="space-y-0.5">
										<FormLabel>Window Height</FormLabel>
										<FormDescription>
											The height of the game window when launched.
										</FormDescription>
									</div>
									<FormControl>
										<Input
											placeholder="480"
											value={field.value ?? undefined}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FormField
							control={form.control}
							name="java_args"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Java Args</FormLabel>
									<FormControl>
										<Input
											autoComplete="false"
											placeholder="Java Args"
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.value)}
										/>
									</FormControl>
									<FormDescription>
										Command line arguments to pass to java on startup.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</section>

					<div className="absolute bottom-4 right-4">
						<Button
							disabled={form.formState.isLoading || form.formState.isSubmitting}
							type="submit"
						>
							Create
						</Button>
					</div>
				</form>
			</Form>
		</ScrollArea>
	);
}
