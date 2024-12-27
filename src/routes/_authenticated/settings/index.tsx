import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { version } from "@azure/msal-browser";
import { Loading } from "@/components/Loading";

export const Route = createFileRoute("/_authenticated/settings/")({
	component: SystemSettings,
	pendingComponent: Loading,
	errorComponent: (error) => <ErrorComponent error={error} />,
});

function SystemSettings() {
	const form = useForm<{ theme: string }>({
		defaultValues: {
			theme: "dark",
		},
	});
	const { data } = useSuspenseQuery({
		queryKey: ["APPLICATION_DATA"],
		queryFn: async () => {
			const [name, tauri, version] = await Promise.all([
				getName(),
				getTauriVersion(),
				getVersion(),
			]);
			return {
				name,
				tauri,
				version,
			};
		},
	});

	const onSubmit = async () => {};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">System</h3>
				<p className="text-sm text-muted-foreground">
					Customize the appearance of the app.
				</p>
			</div>
			<Separator />
			<div className="space-y-4">
				<div>
					<h3 className="mb-4 text-lg font-medium">Appearance</h3>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(onSubmit)}>
							<FormField
								control={form.control}
								name="theme"
								render={({ field }) => (
									<FormItem className="space-y-1">
										<FormLabel>Theme</FormLabel>
										<FormDescription>
											Select the theme for the dashboard.
										</FormDescription>
										<FormMessage />
										<RadioGroup
											onValueChange={field.onChange}
											defaultValue={field.value}
											className="grid max-w-md grid-cols-2 gap-8 pt-2"
										>
											<FormItem>
												<FormLabel className="[&:has([data-state=checked])>div]:border-primary">
													<FormControl>
														<RadioGroupItem value="dark" className="sr-only" />
													</FormControl>
													<div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
														<div className="space-y-2 rounded-sm bg-slate-950 p-2">
															<div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
																<div className="h-2 w-[80px] rounded-lg bg-slate-400" />
																<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
															</div>
															<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
																<div className="h-4 w-4 rounded-full bg-slate-400" />
																<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
															</div>
															<div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
																<div className="h-4 w-4 rounded-full bg-slate-400" />
																<div className="h-2 w-[100px] rounded-lg bg-slate-400" />
															</div>
														</div>
													</div>
													<span className="block w-full p-2 text-center font-normal">
														Dark
													</span>
												</FormLabel>
											</FormItem>
										</RadioGroup>
									</FormItem>
								)}
							/>
						</form>
					</Form>
				</div>
				<div>
					<h3 className="mb-4 text-lg font-medium">
						Application specifications
					</h3>
					<table>
						<tbody>
							<tr>
								<td className="text-left pr-4">App Name</td>
								<td className="text-muted-foreground">{data.name}</td>
							</tr>
							<tr>
								<td className="text-left pr-4">App Version</td>
								<td className="text-muted-foreground">{data.version}</td>
							</tr>
							<tr>
								<td className="text-left pr-4">Tauri Version</td>
								<td className="text-muted-foreground">{data.tauri}</td>
							</tr>
							<tr>
								<td className="text-left pr-4">Msal Version</td>
								<td className="text-muted-foreground">{version}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
