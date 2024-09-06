import { Book, Copy, FolderCheck, FolderOpen, Trash2 } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { ask } from "@tauri-apps/plugin-dialog";
import { join } from "@tauri-apps/api/path";
import { useForm } from "react-hook-form";
import { useEffect, useRef } from "react";
import { toast } from "react-toastify";
import debounce from "lodash.debounce";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import {
	copy_profile,
	db,
	deleteProfile,
	showInFolder,
	uninstallContent,
} from "@/lib/system/commands";
import { ProfileVersionSelector } from "@/components/library/content/profile/ProfileVersionSelector";
import CategorySelect from "@/components/library/content/profile/CategorySelector";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UNCATEGORIZEDP_GUID, categories } from "@/lib/models/categories";
import { type MinecraftProfile, profile } from "@/lib/models/profiles";
import { download_queue } from "@/lib/models/download_queue";
import { TypographyH3 } from "@/components/ui/typography";
import { CATEGORY_KEY, KEY_PROFILE } from "@/hooks/keys";
import { workshop_content } from "@/lib/models/content";
import { profileQueryOptions } from "../_profile.$id";
import { queryClient } from "@/lib/api/queryClient";
import { settings } from "@/lib/models/settings";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Input } from "@/components/ui/input";
import logger from "@/lib/system/logger";
import { JVMArgForm } from "@/components/JVMArgForm";

export const Route = createFileRoute(
	"/_authenticated/_layout/profile/_profile/$id/edit",
)({
	component: ProfileEdit,
	pendingComponent: Loading,
});

const onFormChange = debounce(
	async (og: MinecraftProfile, profile: MinecraftProfile) => {
		for (const key of Object.keys(og) as Array<keyof MinecraftProfile>) {
			if (og[key] !== profile[key]) {
				if (key === "loader") {
					if (og[key] !== "vanilla" && profile[key] !== "vanilla") {
						const deleteMods = await ask(
							"Changing the loader may cause installed content to not work. Would you like to delete all installed mods?",
							{ title: "Loader Switch", kind: "warning" },
						);
						if (deleteMods) {
							const mods = await db.select({
								query:
									"SELECT * FROM profile_content WHERE type = 'Mod' AND profile = ?",
								args: [og.id],
								schema: workshop_content.schema,
							});

							await Promise.allSettled(
								mods.map((e) => uninstallContent(og.id, e.id)),
							);
						}
					}
					await download_queue.insert(
						crypto.randomUUID(),
						true,
						1,
						`${profile.loader} ${profile.loader !== "vanilla" ? profile.loader_version : ""}`,
						profile.icon ?? null,
						profile.id,
						"Client",
						{
							version: profile.version,
							loader: profile.loader?.replace(
								/^\w/,
								profile.loader[0].toUpperCase(),
							),
							loader_version: profile.loader_version,
						},
					);
				}
				await db.execute({
					query: `UPDATE profiles SET ${key} = ? WHERE id = ?`,
					args: [profile[key], og.id],
				});
			}
		}
		await queryClient.invalidateQueries({ queryKey: [KEY_PROFILE, og.id] });
		const cats = await categories.getCategoriesForProfile(og.id);
		await Promise.allSettled(
			cats.map((e) =>
				queryClient.invalidateQueries({ queryKey: [CATEGORY_KEY, e.category] }),
			),
		);
	},
	500,
);

function ProfileEdit() {
	const navigate = Route.useNavigate();
	const formRef = useRef<HTMLFormElement>(null);
	const params = Route.useParams();
	const query = useSuspenseQuery(profileQueryOptions(params.id));
	const form = useForm<MinecraftProfile>({
		resolver: zodResolver(profile.schema),
		defaultValues: query.data,
	});

	useEffect(() => {
		const callback = () => onFormChange(query.data, form.getValues());
		if (formRef.current) {
			formRef.current.addEventListener("change", callback);
		}
		return () => {
			formRef.current?.removeEventListener("change", callback);
		};
	}, [form.getValues, query.data]);

	return (
		<Form {...form}>
			<form ref={formRef} className="space-y-4">
				<section className="space-y-4 rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
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
										{...field}
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

				<section className="space-y-4 rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
					<TypographyH3>Game Settings</TypographyH3>

					<div>
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
											value={field.value ?? undefined}
											onChange={(ev) => field.onChange(ev.target.value)}
											placeholder="854"
										/>
									</FormControl>
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
											value={field.value ?? undefined}
											onChange={(ev) => field.onChange(ev.target.value)}
											placeholder="480"
										/>
									</FormControl>
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
										<JVMArgForm controller={field} />
									</FormControl>
									<FormDescription>
										Cmd arguments to pass to java on startup.
									</FormDescription>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>
				</section>

				<section className="space-y-4 rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
					<TypographyH3>Organiztion</TypographyH3>

					<CategorySelect profile={query.data.id} />
				</section>

				<section className="space-y-4 rounded-lg bg-zinc-900 px-4 py-2 shadow-lg">
					<TypographyH3>Installation Management</TypographyH3>

					<div className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>Profile Folder</FormLabel>
							<FormDescription>Open profile Folder</FormDescription>
						</div>
						<Button
							className="w-32"
							onClick={async () => {
								const setting = await settings.get_setting("path.app");
								if (!setting) return;
								const path = await join(
									setting?.value,
									"profiles",
									query.data.id,
									"/",
								);

								logger.debug(`Open path ${path}`);

								await showInFolder(path);
							}}
							type="button"
							variant="secondary"
						>
							<FolderOpen className="mr-2 h-5 w-5" />
							Open
						</Button>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>Duplicate Profile</FormLabel>
							<FormDescription>Creates a copy of this profile.</FormDescription>
						</div>
						<Button
							className="w-32"
							onClick={async () => {
								try {
									const id = crypto.randomUUID();
									await copy_profile(query.data.id, id);

									await db.execute({
										query:
											"INSERT INTO profiles VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
										args: [
											id,
											`${query.data.name}: Duplicate`,
											query.data.icon,
											query.data.date_created,
											query.data.last_played,
											query.data.version,
											query.data.loader,
											query.data.loader_version,
											query.data.java_args,
											query.data.resolution_width,
											query.data.resolution_height,
											query.data.state,
										],
									});

									await queryClient.invalidateQueries({
										queryKey: [CATEGORY_KEY, UNCATEGORIZEDP_GUID],
									});
									toast.success("Copyed profile");
									navigate({
										to: "/profile/$id",
										params: {
											id: id,
										},
									});
								} catch (error) {
									console.error(error);
									toast.error("Failed to copy", {
										data: { error: (error as Error).message },
									});
								}
							}}
							type="button"
							variant="secondary"
						>
							<Copy className="mr-2 h-5 w-5" />
							Duplicate
						</Button>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>Validate Content</FormLabel>
							<FormDescription>
								Validates all downloaded content for this profile.
							</FormDescription>
						</div>

						<Button className="w-32" type="button" variant="secondary">
							<FolderCheck className="mr-2 h-5 w-5" />
							Validate
						</Button>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div className="max-w-xs">
							<FormLabel>Delete Instance</FormLabel>
							<FormDescription>
								Fully removes a instance from the disk. Be careful, as once you
								delete a instance there is no way to recover it.
							</FormDescription>
						</div>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button className="w-32" variant="destructive" type="button">
									<Trash2 className="mr-2 h-5 w-5" />
									Delete
								</Button>
							</AlertDialogTrigger>
							<AlertDialogContent className="text-white">
								<AlertDialogHeader>
									<AlertDialogTitle>Delete Profile</AlertDialogTitle>
									<AlertDialogDescription>
										This action cannot undone. This will permanently delete
										everything in this profile.
									</AlertDialogDescription>
								</AlertDialogHeader>
								<AlertDialogFooter>
									<AlertDialogCancel>Cancel</AlertDialogCancel>
									<AlertDialogAction
										onClick={async () => {
											//navigate("/");
											const cats = await categories.getCategoriesForProfile(
												query.data.id,
											);
											await profile.delete(query.data.id);
											for (const cat of cats) {
												await queryClient.invalidateQueries({
													queryKey: [CATEGORY_KEY, cat.category],
												});
											}
											await deleteProfile(query.data.id);

											navigate({
												to: "/",
											});
										}}
									>
										Ok
									</AlertDialogAction>
								</AlertDialogFooter>
							</AlertDialogContent>
						</AlertDialog>
					</div>
				</section>
			</form>
		</Form>
	);
}
