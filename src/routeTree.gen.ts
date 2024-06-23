/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from "@tanstack/react-router";

// Import Routes

import { Route as rootRoute } from "./routes/__root";
import { Route as LayoutImport } from "./routes/_layout";
import { Route as AuthenticatedImport } from "./routes/_authenticated";
import { Route as LayoutCreateProfileImport } from "./routes/_layout/create-profile";
import { Route as LayoutCollectionsImport } from "./routes/_layout/collections";
import { Route as LayoutCollectionImport } from "./routes/_layout/collection";
import { Route as LayoutWorkshopIndexImport } from "./routes/_layout/workshop/index";
import { Route as LayoutWorkshopSearchImport } from "./routes/_layout/workshop/search";
import { Route as LayoutProfileIdImport } from "./routes/_layout/profile/$id";
import { Route as LayoutWorkshopProjectIdImport } from "./routes/_layout/workshop/project.$id";
import { Route as LayoutProfileIdScreenshotsImport } from "./routes/_layout/profile/$id.screenshots";
import { Route as LayoutProfileIdEditImport } from "./routes/_layout/profile/$id.edit";

// Create Virtual Routes

const LayoutIndexLazyImport = createFileRoute("/_layout/")();
const LayoutSettingsLazyImport = createFileRoute("/_layout/settings")();
const LayoutDownloadsLazyImport = createFileRoute("/_layout/downloads")();

// Create/Update Routes

const LayoutRoute = LayoutImport.update({
	id: "/_layout",
	getParentRoute: () => rootRoute,
} as any);

const AuthenticatedRoute = AuthenticatedImport.update({
	id: "/_authenticated",
	getParentRoute: () => rootRoute,
} as any);

const LayoutIndexLazyRoute = LayoutIndexLazyImport.update({
	path: "/",
	getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
	import("./routes/_layout/index.lazy").then((d) => d.Route),
);

const LayoutSettingsLazyRoute = LayoutSettingsLazyImport.update({
	path: "/settings",
	getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
	import("./routes/_layout/settings.lazy").then((d) => d.Route),
);

const LayoutDownloadsLazyRoute = LayoutDownloadsLazyImport.update({
	path: "/downloads",
	getParentRoute: () => LayoutRoute,
} as any).lazy(() =>
	import("./routes/_layout/downloads.lazy").then((d) => d.Route),
);

const LayoutCreateProfileRoute = LayoutCreateProfileImport.update({
	path: "/create-profile",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutCollectionsRoute = LayoutCollectionsImport.update({
	path: "/collections",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutCollectionRoute = LayoutCollectionImport.update({
	path: "/collection",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutWorkshopIndexRoute = LayoutWorkshopIndexImport.update({
	path: "/workshop/",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutWorkshopSearchRoute = LayoutWorkshopSearchImport.update({
	path: "/workshop/search",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutProfileIdRoute = LayoutProfileIdImport.update({
	path: "/profile/$id",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutWorkshopProjectIdRoute = LayoutWorkshopProjectIdImport.update({
	path: "/workshop/project/$id",
	getParentRoute: () => LayoutRoute,
} as any);

const LayoutProfileIdScreenshotsRoute = LayoutProfileIdScreenshotsImport.update(
	{
		path: "/screenshots",
		getParentRoute: () => LayoutProfileIdRoute,
	} as any,
);

const LayoutProfileIdEditRoute = LayoutProfileIdEditImport.update({
	path: "/edit",
	getParentRoute: () => LayoutProfileIdRoute,
} as any);

// Populate the FileRoutesByPath interface

declare module "@tanstack/react-router" {
	interface FileRoutesByPath {
		"/_authenticated": {
			id: "/_authenticated";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof AuthenticatedImport;
			parentRoute: typeof rootRoute;
		};
		"/_layout": {
			id: "/_layout";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof LayoutImport;
			parentRoute: typeof rootRoute;
		};
		"/_layout/collection": {
			id: "/_layout/collection";
			path: "/collection";
			fullPath: "/collection";
			preLoaderRoute: typeof LayoutCollectionImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/collections": {
			id: "/_layout/collections";
			path: "/collections";
			fullPath: "/collections";
			preLoaderRoute: typeof LayoutCollectionsImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/create-profile": {
			id: "/_layout/create-profile";
			path: "/create-profile";
			fullPath: "/create-profile";
			preLoaderRoute: typeof LayoutCreateProfileImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/downloads": {
			id: "/_layout/downloads";
			path: "/downloads";
			fullPath: "/downloads";
			preLoaderRoute: typeof LayoutDownloadsLazyImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/settings": {
			id: "/_layout/settings";
			path: "/settings";
			fullPath: "/settings";
			preLoaderRoute: typeof LayoutSettingsLazyImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/": {
			id: "/_layout/";
			path: "/";
			fullPath: "/";
			preLoaderRoute: typeof LayoutIndexLazyImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/profile/$id": {
			id: "/_layout/profile/$id";
			path: "/profile/$id";
			fullPath: "/profile/$id";
			preLoaderRoute: typeof LayoutProfileIdImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/workshop/search": {
			id: "/_layout/workshop/search";
			path: "/workshop/search";
			fullPath: "/workshop/search";
			preLoaderRoute: typeof LayoutWorkshopSearchImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/workshop/": {
			id: "/_layout/workshop/";
			path: "/workshop";
			fullPath: "/workshop";
			preLoaderRoute: typeof LayoutWorkshopIndexImport;
			parentRoute: typeof LayoutImport;
		};
		"/_layout/profile/$id/edit": {
			id: "/_layout/profile/$id/edit";
			path: "/edit";
			fullPath: "/profile/$id/edit";
			preLoaderRoute: typeof LayoutProfileIdEditImport;
			parentRoute: typeof LayoutProfileIdImport;
		};
		"/_layout/profile/$id/screenshots": {
			id: "/_layout/profile/$id/screenshots";
			path: "/screenshots";
			fullPath: "/profile/$id/screenshots";
			preLoaderRoute: typeof LayoutProfileIdScreenshotsImport;
			parentRoute: typeof LayoutProfileIdImport;
		};
		"/_layout/workshop/project/$id": {
			id: "/_layout/workshop/project/$id";
			path: "/workshop/project/$id";
			fullPath: "/workshop/project/$id";
			preLoaderRoute: typeof LayoutWorkshopProjectIdImport;
			parentRoute: typeof LayoutImport;
		};
	}
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
	LayoutRoute: LayoutRoute.addChildren({
		LayoutCollectionRoute,
		LayoutCollectionsRoute,
		LayoutCreateProfileRoute,
		LayoutDownloadsLazyRoute,
		LayoutSettingsLazyRoute,
		LayoutIndexLazyRoute,
		LayoutProfileIdRoute: LayoutProfileIdRoute.addChildren({
			LayoutProfileIdEditRoute,
			LayoutProfileIdScreenshotsRoute,
		}),
		LayoutWorkshopSearchRoute,
		LayoutWorkshopIndexRoute,
		LayoutWorkshopProjectIdRoute,
	}),
});

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_authenticated",
        "/_layout"
      ]
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx"
    },
    "/_layout": {
      "filePath": "_layout.tsx",
      "children": [
        "/_layout/collection",
        "/_layout/collections",
        "/_layout/create-profile",
        "/_layout/downloads",
        "/_layout/settings",
        "/_layout/",
        "/_layout/profile/$id",
        "/_layout/workshop/search",
        "/_layout/workshop/",
        "/_layout/workshop/project/$id"
      ]
    },
    "/_layout/collection": {
      "filePath": "_layout/collection.tsx",
      "parent": "/_layout"
    },
    "/_layout/collections": {
      "filePath": "_layout/collections.tsx",
      "parent": "/_layout"
    },
    "/_layout/create-profile": {
      "filePath": "_layout/create-profile.tsx",
      "parent": "/_layout"
    },
    "/_layout/downloads": {
      "filePath": "_layout/downloads.lazy.tsx",
      "parent": "/_layout"
    },
    "/_layout/settings": {
      "filePath": "_layout/settings.lazy.tsx",
      "parent": "/_layout"
    },
    "/_layout/": {
      "filePath": "_layout/index.lazy.tsx",
      "parent": "/_layout"
    },
    "/_layout/profile/$id": {
      "filePath": "_layout/profile/$id.tsx",
      "parent": "/_layout",
      "children": [
        "/_layout/profile/$id/edit",
        "/_layout/profile/$id/screenshots"
      ]
    },
    "/_layout/workshop/search": {
      "filePath": "_layout/workshop/search.tsx",
      "parent": "/_layout"
    },
    "/_layout/workshop/": {
      "filePath": "_layout/workshop/index.tsx",
      "parent": "/_layout"
    },
    "/_layout/profile/$id/edit": {
      "filePath": "_layout/profile/$id.edit.tsx",
      "parent": "/_layout/profile/$id"
    },
    "/_layout/profile/$id/screenshots": {
      "filePath": "_layout/profile/$id.screenshots.tsx",
      "parent": "/_layout/profile/$id"
    },
    "/_layout/workshop/project/$id": {
      "filePath": "_layout/workshop/project.$id.tsx",
      "parent": "/_layout"
    }
  }
}
ROUTE_MANIFEST_END */
