import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ToastContainer } from "react-toastify";
import { lazy } from "react";

import type { AppContext } from "@/types";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/Footer";

const TanStackRouterDevtools = import.meta.env.DEV
	? lazy(() =>
			import("@tanstack/router-devtools").then((res) => ({
				default: res.TanStackRouterDevtools,
			})),
		)
	: () => null;

const Index: React.FC = () => {
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
			<ReactQueryDevtools />
			<TanStackRouterDevtools position="bottom-right" />
		</>
	);
};

export const Route = createRootRouteWithContext<AppContext>()({
	component: Index,
});
