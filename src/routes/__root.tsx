import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ToastContainer } from "react-toastify";

import type { AppContext } from "@/types";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/Footer";

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
