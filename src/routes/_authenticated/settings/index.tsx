import { getName, getTauriVersion, getVersion } from "@tauri-apps/api/app";
import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import {
	Form,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { RadioGroup } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Theme } from "@/components/settings/Theme";
import { Loading } from "@/components/Loading";
import { loadThemes } from "@/lib/api/themes";

export const Route = createFileRoute("/_authenticated/settings/")({
	component: SystemSettings,
	pendingComponent: Loading,
	errorComponent: (error) => <ErrorComponent error={error} />,
});

function SystemSettings() {
	const form = useForm<{ theme: string }>({
		defaultValues: {
			theme: localStorage.getItem("theme") ?? "dark",
		},
	});
	const { data } = useSuspenseQuery({
		queryKey: ["APPLICATION_DATA"],
		queryFn: async () => {
			const [name, tauri, version, themes] = await Promise.all([
				getName(),
				getTauriVersion(),
				getVersion(),
				loadThemes(),
			]);
			return {
				name,
				tauri,
				version,
				themes,
			};
		},
	});

	const onSubmit = async () => {};

	return (
		<div className="space-y-6">
			<div>
				<h3 className="text-lg font-medium">System</h3>
				<p className="text-sm text-muted-foreground">
					General application settings.
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
									<FormItem>
										<FormLabel>Theme</FormLabel>
										<FormDescription>
											Select the theme for the dashboard.
										</FormDescription>
										<FormMessage />
										<RadioGroup
											onValueChange={(value) => {
												field.onChange(value);
												const htmlDoc = document.querySelector("html");
												htmlDoc?.setAttribute("data-theme", value);
												localStorage.setItem("theme", value);
											}}
											defaultValue={field.value}
											className="flex flex-wrap gap-2"
										>
											<Theme
												currentValue={field.value}
												value="dark"
												title="Default"
											/>
											<Theme
												currentValue={field.value}
												value="rose"
												title="Rose"
											/>
											<Theme
												currentValue={field.value}
												value="red"
												title="Red"
											/>
											{data.themes.map((theme) => (
												<Theme
													key={theme.path}
													currentValue={field.value}
													value={theme.name}
													title={theme.title}
												/>
											))}
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
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
