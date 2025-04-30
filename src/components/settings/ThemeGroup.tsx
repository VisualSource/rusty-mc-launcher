import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormDescription, FormItem, FormLabel } from "../ui/form";
import { RadioGroup } from "../ui/radio-group";
import { Theme } from "./Theme";
import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { ExternalThemes } from "./ExternalThemes";
import { Loading } from "../Loading";
import { Button } from "../ui/button";
import { RefreshCcw } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { initThemes } from "@/lib/api/themes";

export const ThemeControl: React.FC = () => {
	const queryClient = useQueryClient();
	const { data: currentTheme } = useQuery({
		queryKey: ["theme"],
		queryFn: () => localStorage.getItem("theme") ?? "default",
		initialData: "default",
	});

	return (
		<FormItem>
			<div className="flex justify-between">
				<div>
					<FormLabel>Theme</FormLabel>
					<FormDescription>Select the theme for the dashboard.</FormDescription>
				</div>

				<Tooltip>
					<TooltipTrigger asChild>
						<Button onClick={() => initThemes()}>
							<RefreshCcw />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Reload Themes</p>
					</TooltipContent>
				</Tooltip>
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
				<div className="flex">
					<Theme currentValue={currentTheme} value="default" title="Default" />
					<Theme currentValue={currentTheme} value="t3-chat" title="T3 Chat" />
				</div>

				<ErrorBoundary fallback={<div>Failed to load external themes</div>}>
					<Suspense fallback={<Loading />}>
						<ExternalThemes current={currentTheme} />
					</Suspense>
				</ErrorBoundary>
			</RadioGroup>
		</FormItem>
	);
};
