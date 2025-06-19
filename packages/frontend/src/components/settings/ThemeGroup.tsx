import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDescription, FormItem, FormLabel } from "../ui/form";
import { RadioGroup } from "../ui/radio-group";
import { Theme } from "./Theme";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { ExternalThemes } from "./ExternalThemes";
import { Loading } from "../Loading";
import { Button } from "../ui/button";
import { Folder, RefreshCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { getThemesDirectory, initThemes } from "@/lib/api/themes";
import { openPath } from "@tauri-apps/plugin-opener";
import { error } from "@tauri-apps/plugin-log";

export const ThemeControl: React.FC = () => {
	const queryClient = useQueryClient();
	const { data: currentTheme } = useQuery({
		queryKey: ["theme"],
		queryFn: () => localStorage.getItem("theme") ?? "default",
		initialData: "default",
	});

	return (
		<FormItem>
			<div className="flex justify-between border-b pb-2 mb-2">
				<div >
					<FormLabel>Theme</FormLabel>
					<FormDescription>Select the theme for the dashboard.</FormDescription>
				</div>
				<div className="flex gap-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<Button type="button" variant="secondary" onClick={() => getThemesDirectory().then(e => openPath(e)).catch(err => error((err as Error).message))}>
								<Folder />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Open Themes Folder</p>
						</TooltipContent>
					</Tooltip>
					<Tooltip>
						<TooltipTrigger asChild>
							<Button type="button" onClick={() => initThemes()}>
								<RefreshCcw />
							</Button>
						</TooltipTrigger>
						<TooltipContent>
							<p>Reload Themes</p>
						</TooltipContent>
					</Tooltip>
				</div>
			</div>
			<RadioGroup
				onValueChange={(value) => {
					const htmlDoc = document.querySelector("html");
					htmlDoc?.setAttribute("data-theme", value);
					localStorage.setItem("theme", value);
					queryClient.invalidateQueries({ queryKey: ["theme"] });
				}}
				defaultValue={currentTheme}
			>
				<div className="flex gap-2 flex-wrap">
					<Theme currentValue={currentTheme} value="default" title="Default" />
					<Theme currentValue={currentTheme} value="t3-chat" title="T3 Chat" />
					<ErrorBoundary fallback={<div>Failed to load external themes</div>}>
						<Suspense fallback={<Loading />}>
							<ExternalThemes current={currentTheme} />
						</Suspense>
					</ErrorBoundary>
				</div>
			</RadioGroup>
		</FormItem>
	);
};
