import { createRootRouteWithContext, Outlet, useNavigate } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { ToastContainer } from "react-toastify";
import { lazy, useEffect } from "react";

import AskDialog from "@/components/dialog/AskDialog";
import Navbar from "@/components/navbar/Navbar";
import type { AppContext } from "@/types";
import Footer from "@/components/Footer";

const TanStackRouterDevtools = import.meta.env.DEV
	? lazy(() =>
		import("@tanstack/router-devtools").then((res) => ({
			default: res.TanStackRouterDevtools,
		})),
	)
	: () => null;

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
					id
				}
			})
		});

		return () => {
			listen.then(e => e()).catch(e => {
				console.error(e);
			});
		}
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

export const Route = createRootRouteWithContext<AppContext>()({
	component: Index,
});
