import {
	Download,
	FileDiff,
	Monitor,
	PackagePlus,
	PlusSquare,
} from "lucide-react";
import {
	AuthenticatedTemplate,
	UnauthenticatedTemplate,
} from "@azure/msal-react";
import { downloadDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-dialog";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { memo, useState } from "react";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@component/ui/dropdown-menu";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import { download_queue } from "@/lib/models/download_queue";
import { TypographyMuted } from "@component/ui/typography";
import import_profiles from "@/lib/system/import_profiles";
import { QueueItemState } from "@/lib/QueueItemState";
import { queryClient } from "@/lib/api/queryClient";
import { useCurrentQueue } from "@/hooks/useQueue";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { Progress } from "@component/ui/progress";
import { Button } from "@component/ui/button";
import { Form, FormField } from "./ui/form";
import useDownload from "@hook/useDownload";
import { Label } from "./ui/label";

type FormState = { importFrom: "modrinth" | "curseforge" };

const Footer = memo(() => {
	const [openDialog, setOpen] = useState(false);
	const { progress } = useDownload();
	const queueCurrent = useCurrentQueue();

	const form = useForm<FormState>({
		defaultValues: {
			importFrom: "modrinth",
		},
	});

	const onSubmit = async (state: FormState) => {
		setOpen(false);

		const display =
			state.importFrom === "modrinth"
				? {
						queue: {
							name: "MrPack($PACK_PATH)",
							type: "Modpack",
						},
						dialog: {
							title: "Import Mrpack",
							filters: [
								{
									name: "Mrpack",
									extensions: ["mrpack"],
								},
							],
						},
					}
				: {
						queue: {
							name: "Curseforge Modpack ($PACK_PATH)",
							type: "CurseforgeModpack",
						},
						dialog: {
							title: "Import Modpack",
							filters: [
								{
									name: "Zip",
									extensions: ["zip"],
								},
							],
						},
					};

		const result = await open({
			multiple: false,
			defaultPath: await downloadDir(),
			title: display.dialog.title,
			filters: display.dialog.filters,
		});

		if (!result || Array.isArray(result)) return;

		const queue_id = crypto.randomUUID();
		const profile_id = crypto.randomUUID();

		await download_queue.insert(
			queue_id,
			true,
			0,
			display.queue.name.replace("$PACK_PATH", result),
			null,
			profile_id,
			display.queue.type as never as "Modpack" | "CurseforgeModpack",
			{
				content_type: "Modpack",
				profile: profile_id,
				files: [
					{
						sha1: "UNKNOWN",
						url: result,
						version: "UNKNOWN",
						filename: "UNKOWN",
						id: "UNKOWN",
					},
				],
			},
		);
		await queryClient.invalidateQueries({
			queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
		});

		form.reset();
	};

	return (
		<footer className="flex h-16 flex-shrink-0 flex-grow-0 bg-zinc-950 text-zinc-400 shadow">
			<AuthenticatedTemplate>
				<div className="flex h-full w-full shrink items-center justify-start">
					<Dialog open={openDialog} onOpenChange={setOpen}>
						<DialogContent>
							<Form {...form}>
								<form
									className="space-y-4"
									onSubmit={form.handleSubmit(onSubmit)}
								>
									<DialogHeader>
										<DialogTitle>Import Modpack</DialogTitle>
										<DialogDescription>
											Import a modpack from modrinth or Curseforge
										</DialogDescription>
										<DialogClose />
									</DialogHeader>
									<FormField
										name="importFrom"
										control={form.control}
										render={({ field }) => (
											<RadioGroup
												onValueChange={field.onChange}
												defaultValue={field.value}
												value={field.value}
												className="grid grid-cols-2 gap-4"
											>
												<div>
													<RadioGroupItem
														value="modrinth"
														id="modrinth"
														className="peer sr-only"
													/>
													<Label
														htmlFor="modrinth"
														className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
													>
														Modrinth
													</Label>
												</div>
												<div>
													<RadioGroupItem
														value="curseforge"
														id="curseforge"
														className="peer sr-only"
													/>
													<Label
														htmlFor="curseforge"
														className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
													>
														CurseForge
													</Label>
												</div>
											</RadioGroup>
										)}
									/>
									<DialogFooter>
										<Button type="submit">Ok</Button>
									</DialogFooter>
								</form>
							</Form>
						</DialogContent>
						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<Button
									variant="ghost"
									className="group dark:hover:bg-transparent"
								>
									<PlusSquare className="pr-2" />
									<TypographyMuted className="transition-colors dark:group-hover:text-zinc-300">
										Add a Profile
									</TypographyMuted>
								</Button>
							</DropdownMenuTrigger>
							<DropdownMenuContent>
								<DropdownMenuItem asChild>
									<Link to="/create-profile">Create Profile</Link>
								</DropdownMenuItem>
								<DropdownMenuItem onClick={import_profiles}>
									Import Profiles
								</DropdownMenuItem>
								<DropdownMenuItem>
									<DialogTrigger>Import Modpack</DialogTrigger>
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</Dialog>
				</div>
			</AuthenticatedTemplate>
			<UnauthenticatedTemplate>
				<div className="flex h-full w-full shrink items-center justify-start" />
			</UnauthenticatedTemplate>

			<div className="flex h-full w-full flex-1 items-center justify-center">
				<Button
					variant="ghost"
					className="hover:bg-transparent dark:hover:bg-transparent"
					asChild
				>
					<Link to="/downloads" className="group">
						{queueCurrent.data && progress ? (
							<div className="flex items-center gap-3">
								<Avatar className="rounded-none">
									<AvatarFallback className="rounded-lg">
										{queueCurrent.data?.content_type === "Client" ? (
											<Monitor />
										) : queueCurrent?.data?.content_type === "Mod" ? (
											<PackagePlus />
										) : (
											<FileDiff />
										)}
									</AvatarFallback>
									<AvatarImage src={queueCurrent.data.icon ?? undefined} />
								</Avatar>
								<div className="w-96">
									<div className="flex w-full justify-between">
										<TypographyMuted asChild className="mb-1 line-clamp-1">
											<span>{progress.message}</span>
										</TypographyMuted>
										<TypographyMuted asChild>
											<span>
												{Math.floor(
													100 * (progress.progress / progress.max_progress),
												)}
												%
											</span>
										</TypographyMuted>
									</div>
									<Progress
										value={Math.floor(
											100 * (progress.progress / progress.max_progress),
										)}
									/>
								</div>
							</div>
						) : (
							<>
								<Download className="pr-2" />
								<TypographyMuted className="transition-colors dark:group-hover:text-zinc-300">
									Manage Downloads
								</TypographyMuted>
							</>
						)}
					</Link>
				</Button>
			</div>

			<div className="flex h-full w-full shrink items-center justify-end" />
		</footer>
	);
});

export default Footer;
