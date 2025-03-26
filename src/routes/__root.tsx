import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	Outlet,
	useNavigate,
} from "@tanstack/react-router";
import { relaunch } from "@tauri-apps/plugin-process";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { ToastContainer } from "react-toastify";
import { AlertTriangle } from "lucide-react";
import { useEffect } from "react";

import { TypographyH1 } from "@/components/ui/typography";
import AskDialog from "@/components/dialog/AskDialog";
import Navbar from "@/components/navbar/Navbar";
import type { AppContext } from "@/types";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const Index: React.FC = () => {
	const navigate = useNavigate();

	useEffect(() => {
		const listen = onOpenUrl((urls) => {
			const url = urls.at(0);
			if (!url || !url.startsWith("rmcl://curseforge/")) return;
			const id = url.replace("rmcl://curseforge/", "");

			navigate({
				to: "/workshop/curseforge/$id",
				params: {
					id,
				},
			});
		});

		return () => {
			listen
				.then((e) => e())
				.catch((e) => {
					console.error(e);
				});
		};
	}, [navigate]);

	return (
		<>
			<Navbar />
			<main className="overflow-x-hidden flex-1 flex flex-col scrollbar">
				<Outlet />
			</main>
			<Footer />
			<ToastContainer
				stacked
				pauseOnFocusLoss={false}
				position="bottom-right"
				theme="dark"
			/>
			<AskDialog />
			<ReactQueryDevtools />
			<TanStackRouterDevtools position="bottom-right" />
		</>
	);
};

const ErrorPage: React.FC<ErrorComponentProps> = ({ error }) => {
	return (
		<div className="w-full h-full flex flex-col justify-center items-center gap-4">
			<div className="flex flex-col justify-center items-center gap-4">
				<AlertTriangle className="h-20 w-20 text-red-500" />
				<TypographyH1 className="select-none">
					Something went very wrong
				</TypographyH1>
			</div>

			<Button variant="ghost" size="sm" onClick={() => relaunch()}>
				Restart
			</Button>

			<details className="h-14 w-96">
				<summary className="text-sm text-muted-foreground">Show Error</summary>

				<div className="border rounded-lg p-2 bg-zinc-800">
					<code className="text-red-500 text-sm italic">{error.message}</code>
				</div>
			</details>
		</div>
	);
};

export const Route = createRootRouteWithContext<AppContext>()({
	component: Index,
	errorComponent: ErrorPage,
});
