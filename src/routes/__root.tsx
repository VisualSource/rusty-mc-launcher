import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

import type { AppContext } from "@/types";

const Index: React.FC = () => {
	return (
		<>
			<Outlet />
			<TanStackRouterDevtools />
		</>
	);
};

export const Route = createRootRouteWithContext<AppContext>()({
	component: Index,
});
