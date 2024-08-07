import {
	createRouter,
	ErrorComponent,
	stringifySearchWith,
} from "@tanstack/react-router";
import { queryClient } from "@lib/api/queryClient";

import { Loading } from "./components/Loading";
import { routeTree } from "./routeTree.gen";
import { Facets } from "./lib/Facets";

function replacer(_key: string, value: unknown) {
	if (value instanceof Facets) return value.toArray();
	return value;
}

export const router = createRouter({
	routeTree,
	defaultPreload: "intent",
	defaultPreloadStaleTime: 0,
	defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
	defaultPendingComponent: () => <Loading />,
	stringifySearch: stringifySearchWith((value) =>
		JSON.stringify(value, replacer),
	),
	context: {
		queryClient,
		auth: {
			msa: undefined,
			modrinth: undefined,
		},
	},
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}
