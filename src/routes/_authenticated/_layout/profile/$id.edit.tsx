import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { TypographyH3 } from "@/components/ui/typography";
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import debounce from "lodash.debounce";
import { ProfileVersionSelector } from "@/components/library/content/profile/ProfileVersionSelector";
import { type MinecraftProfile, profile } from "@/lib/models/profiles";
import { useSuspenseQuery } from "@tanstack/react-query";
import { profileQueryOptions } from "./$id";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Book, Copy, FolderCheck, FolderOpen, Trash2 } from "lucide-react";
import CategorySelect from "@/components/library/content/profile/CategorySelector";
import { Button } from "@/components/ui/button";
import { settings } from "@/lib/models/settings";
import { join } from "@tauri-apps/api/path";
import logger from "@/lib/system/logger";
import { copy_profile, db, deleteProfile, showInFolder } from "@/lib/system/commands";
import { queryClient } from "@/lib/api/queryClient";
import { CATEGORY_KEY } from "@/hooks/keys";
import { UNCATEGORIZEDP_GUID, categories } from "@/lib/models/categories";
import { toast } from "react-toastify";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
export const Route = createFileRoute("/_authenticated/_layout/profile/$id/edit")({
	component: ProfileEdit,
});

const onFormChange = debounce((_profile: MinecraftProfile) => {
	console.log("hello");
}, 500);

function ProfileEdit() {
	const params = Route.useParams();
	const query = useSuspenseQuery(profileQueryOptions(params.id));

	const form = useForm<MinecraftProfile>({
		resolver: zodResolver(profile.schema),
		defaultValues: query.data
	});

	return (
		<Form {...form}>
			<form className="space-y-4" onChange={() => onFormChange(form.getValues())}>
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

				<section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
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
										<Input
											autoComplete="false"
											placeholder="Java Args"
											value={field.value ?? ""}
											onChange={(e) => field.onChange(e.target.value)}
										/>
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

				<section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
					<TypographyH3>Organiztion</TypographyH3>

					<CategorySelect profile={form.getValues("id")} />
				</section>

				<section className="space-y-4 rounded-md bg-zinc-900 px-4 py-2 shadow-lg">
					<TypographyH3>Installation Management</TypographyH3>

					<div className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>Profile Folder</FormLabel>
							<FormDescription>Open profile Folder</FormDescription>
						</div>
						<Button
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
							<FormDescription>
								Creates a copy of this profile.
							</FormDescription>
						</div>
						<Button
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

						<Button type="button">
							<FolderCheck className="mr-2 h-5 w-5" />
							Validate
						</Button>
					</div>

					<div className="flex items-center justify-between gap-4">
						<div>
							<FormLabel>Delete Instance</FormLabel>
							<FormDescription>
								Fully removes a instance from the disk. Be careful, as once
								you delete a instance there is no way to recover it.
							</FormDescription>
						</div>

						<AlertDialog>
							<AlertDialogTrigger asChild>
								<Button variant="destructive" type="button">
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
											const cats = await categories.getCategoriesForProfile(query.data.id);
											await profile.delete(query.data.id);
											for (const cat of cats) {
												await queryClient.invalidateQueries({
													queryKey: [CATEGORY_KEY, cat.category],
												});
											}
											await deleteProfile(query.data.id);
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