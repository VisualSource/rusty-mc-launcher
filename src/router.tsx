import {
	createRouter,
	ErrorComponent,
} from "@tanstack/react-router";
import { queryClient } from "@lib/api/queryClient";

import { Loading } from "./components/Loading";
import { routeTree } from "./routeTree.gen";

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	defaultErrorComponent: ({ error }) => (
		<div>
			{" "}
			<ErrorComponent error={error} />
		</div>
	),
	defaultPendingComponent: () => <Loading />,
	context: {
		queryClient,
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
