import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { error } from "@tauri-apps/plugin-log";
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
import { toastLoading, toastUpdateError, toastUpdateSuccess } from "@/lib/toast";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loading } from "@/components/Loading";
import { Input } from "@/components/ui/input";

export const Route = createLazyFileRoute("/_authenticated/bug-report")({
	component: BugReport,
	pendingComponent: Loading,
});

type FormState = {
	body: string;
	title: string;
};

function BugReport() {
	const navigate = useNavigate();
	const form = useForm<FormState>();

	const onSubmit = async (state: FormState) => {
		const toastId = toastLoading({
			title: "Submitting report",
		});

		try {
			const response = await fetch(
				"https://api.github.com/repos/VisualSource/rusty-mc-launcher/issues",
				{
					method: "POST",
					headers: {
						Accept: "application/vnd.github+json",
						Authorization: `Bearer ${import.meta.env.VITE_GITHUB}`,
						"X-GitHub-Api-Version": import.meta.env.VITE_GITHUB_API_VERSION,
					},
					body: JSON.stringify({
						...state,
						labels: ["bug", "from-client"],
					}),
				},
			);

			if (!response.ok)
				throw new Error(response.statusText, { cause: response });

			const data = (await response.json()) as { html_url: string };

			toastUpdateSuccess(toastId, {
				title: "Report submited",
				description: data.html_url,
			});
			navigate({ to: "/" });
		} catch (err) {
			error((err as Error).message, { file: "/bug-report.lazy" });

			toastUpdateError(toastId, {
				error: (err as Error),
				title: "Submition Failed",
				description: "Failed to submit report"
			});
		}
	};

	return (
		<div className="flex flex-col w-full items-center bg-accent/50 h-full py-4 space-y-6">
			<div className="w-2/3 ">
				<div>
					<h2 className="text-xl font-medium">Bug Report</h2>
					<p className="text-sm text-muted-foreground">
						Create a bug report. View all open issues{" "}
						<a
							className="underline text-blue-500"
							target="_blank"
							rel="noopener noreferrer"
							href={"https://github.com/VisualSource/rusty-mc-launcher/issues"}
						>
							Here
						</a>
					</p>
				</div>
				<Separator />
			</div>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="w-2/3 space-y-6"
				>
					<FormField
						rules={{
							maxLength: {
								value: 256,
								message: "The title needs to be less then 256 characters",
							},
							minLength: {
								value: 3,
								message: "The title needs to be more then 3 characters",
							},
							required: { value: true, message: "A title is required" },
						}}
						control={form.control}
						name="title"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Title</FormLabel>
								<FormControl>
									<Input placeholder="Typo in login menu" {...field} />
								</FormControl>
								<FormDescription>
									A descriptive title of the issue
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<FormField
						rules={{
							minLength: {
								value: 3,
								message: "The description needs to be more then 3 characters",
							},
							required: { value: true, message: "A description is required" },
						}}
						control={form.control}
						name="body"
						render={({ field }) => (
							<FormItem>
								<FormLabel>Description</FormLabel>
								<FormControl>
									<Textarea
										placeholder="A typo was found in Y when i was doing X"
										className="resize-none"
										{...field}
									/>
								</FormControl>
								<FormDescription>
									Describe what this issue is and where it was found. More
									detail the better. Markdown is useable.{" "}
									<a
										className="underline text-blue-500"
										target="_blank"
										rel="noopener noreferrer"
										href="https://www.markdownguide.org/cheat-sheet/"
									>
										View cheat sheet
									</a>
								</FormDescription>
								<FormMessage />
							</FormItem>
						)}
					/>
					<div>
						<Button disabled={form.formState.isSubmitting} type="submit">
							{form.formState.isSubmitting ? "Submitting" : "Submit"}
						</Button>
					</div>
				</form>
			</Form>
		</div>
	);
}
