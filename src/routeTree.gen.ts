/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as AuthenticatedImport } from './routes/_authenticated'
import { Route as AuthenticatedCreateProfileImport } from './routes/_authenticated/create-profile'
import { Route as AuthenticatedCollectionsImport } from './routes/_authenticated/collections'
import { Route as AuthenticatedCollectionImport } from './routes/_authenticated/collection'
import { Route as AuthenticatedWorkshopIndexImport } from './routes/_authenticated/workshop/index'
import { Route as AuthenticatedWorkshopSearchImport } from './routes/_authenticated/workshop/search'
import { Route as AuthenticatedProfileIdImport } from './routes/_authenticated/profile/$id'
import { Route as AuthenticatedWorkshopProjectIdImport } from './routes/_authenticated/workshop/project.$id'
import { Route as AuthenticatedProfileIdScreenshotsImport } from './routes/_authenticated/profile/$id.screenshots'
import { Route as AuthenticatedProfileIdEditImport } from './routes/_authenticated/profile/$id.edit'

// Create Virtual Routes

const AuthenticatedIndexLazyImport = createFileRoute('/_authenticated/')()
const AuthenticatedSettingsLazyImport = createFileRoute(
  '/_authenticated/settings',
)()
const AuthenticatedDownloadsLazyImport = createFileRoute(
  '/_authenticated/downloads',
)()

// Create/Update Routes

const AuthenticatedRoute = AuthenticatedImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRoute,
} as any)

const AuthenticatedIndexLazyRoute = AuthenticatedIndexLazyImport.update({
  path: '/',
  getParentRoute: () => AuthenticatedRoute,
} as any).lazy(() =>
  import('./routes/_authenticated/index.lazy').then((d) => d.Route),
)

const AuthenticatedSettingsLazyRoute = AuthenticatedSettingsLazyImport.update({
  path: '/settings',
  getParentRoute: () => AuthenticatedRoute,
} as any).lazy(() =>
  import('./routes/_authenticated/settings.lazy').then((d) => d.Route),
)

const AuthenticatedDownloadsLazyRoute = AuthenticatedDownloadsLazyImport.update(
  {
    path: '/downloads',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
).lazy(() =>
  import('./routes/_authenticated/downloads.lazy').then((d) => d.Route),
)

const AuthenticatedCreateProfileRoute = AuthenticatedCreateProfileImport.update(
  {
    path: '/create-profile',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
)

const AuthenticatedCollectionsRoute = AuthenticatedCollectionsImport.update({
  path: '/collections',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedCollectionRoute = AuthenticatedCollectionImport.update({
  path: '/collection',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedWorkshopIndexRoute = AuthenticatedWorkshopIndexImport.update(
  {
    path: '/workshop/',
    getParentRoute: () => AuthenticatedRoute,
  } as any,
)

const AuthenticatedWorkshopSearchRoute =
  AuthenticatedWorkshopSearchImport.update({
    path: '/workshop/search',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedProfileIdRoute = AuthenticatedProfileIdImport.update({
  path: '/profile/$id',
  getParentRoute: () => AuthenticatedRoute,
} as any)

const AuthenticatedWorkshopProjectIdRoute =
  AuthenticatedWorkshopProjectIdImport.update({
    path: '/workshop/project/$id',
    getParentRoute: () => AuthenticatedRoute,
  } as any)

const AuthenticatedProfileIdScreenshotsRoute =
  AuthenticatedProfileIdScreenshotsImport.update({
    path: '/screenshots',
    getParentRoute: () => AuthenticatedProfileIdRoute,
  } as any)

const AuthenticatedProfileIdEditRoute = AuthenticatedProfileIdEditImport.update(
  {
    path: '/edit',
    getParentRoute: () => AuthenticatedProfileIdRoute,
  } as any,
)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: ''
      preLoaderRoute: typeof AuthenticatedImport
      parentRoute: typeof rootRoute
    }
    '/_authenticated/collection': {
      id: '/_authenticated/collection'
      path: '/collection'
      fullPath: '/collection'
      preLoaderRoute: typeof AuthenticatedCollectionImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/collections': {
      id: '/_authenticated/collections'
      path: '/collections'
      fullPath: '/collections'
      preLoaderRoute: typeof AuthenticatedCollectionsImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/create-profile': {
      id: '/_authenticated/create-profile'
      path: '/create-profile'
      fullPath: '/create-profile'
      preLoaderRoute: typeof AuthenticatedCreateProfileImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/downloads': {
      id: '/_authenticated/downloads'
      path: '/downloads'
      fullPath: '/downloads'
      preLoaderRoute: typeof AuthenticatedDownloadsLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/settings': {
      id: '/_authenticated/settings'
      path: '/settings'
      fullPath: '/settings'
      preLoaderRoute: typeof AuthenticatedSettingsLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/': {
      id: '/_authenticated/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedIndexLazyImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/profile/$id': {
      id: '/_authenticated/profile/$id'
      path: '/profile/$id'
      fullPath: '/profile/$id'
      preLoaderRoute: typeof AuthenticatedProfileIdImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/workshop/search': {
      id: '/_authenticated/workshop/search'
      path: '/workshop/search'
      fullPath: '/workshop/search'
      preLoaderRoute: typeof AuthenticatedWorkshopSearchImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/workshop/': {
      id: '/_authenticated/workshop/'
      path: '/workshop'
      fullPath: '/workshop'
      preLoaderRoute: typeof AuthenticatedWorkshopIndexImport
      parentRoute: typeof AuthenticatedImport
    }
    '/_authenticated/profile/$id/edit': {
      id: '/_authenticated/profile/$id/edit'
      path: '/edit'
      fullPath: '/profile/$id/edit'
      preLoaderRoute: typeof AuthenticatedProfileIdEditImport
      parentRoute: typeof AuthenticatedProfileIdImport
    }
    '/_authenticated/profile/$id/screenshots': {
      id: '/_authenticated/profile/$id/screenshots'
      path: '/screenshots'
      fullPath: '/profile/$id/screenshots'
      preLoaderRoute: typeof AuthenticatedProfileIdScreenshotsImport
      parentRoute: typeof AuthenticatedProfileIdImport
    }
    '/_authenticated/workshop/project/$id': {
      id: '/_authenticated/workshop/project/$id'
      path: '/workshop/project/$id'
      fullPath: '/workshop/project/$id'
      preLoaderRoute: typeof AuthenticatedWorkshopProjectIdImport
      parentRoute: typeof AuthenticatedImport
    }
  }
}

// Create and export the route tree

export const routeTree = rootRoute.addChildren({
  AuthenticatedRoute: AuthenticatedRoute.addChildren({
    AuthenticatedCollectionRoute,
    AuthenticatedCollectionsRoute,
    AuthenticatedCreateProfileRoute,
    AuthenticatedDownloadsLazyRoute,
    AuthenticatedSettingsLazyRoute,
    AuthenticatedIndexLazyRoute,
    AuthenticatedProfileIdRoute: AuthenticatedProfileIdRoute.addChildren({
      AuthenticatedProfileIdEditRoute,
      AuthenticatedProfileIdScreenshotsRoute,
    }),
    AuthenticatedWorkshopSearchRoute,
    AuthenticatedWorkshopIndexRoute,
    AuthenticatedWorkshopProjectIdRoute,
  }),
})

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_authenticated"
      ]
    },
    "/_authenticated": {
      "filePath": "_authenticated.tsx",
      "children": [
        "/_authenticated/collection",
        "/_authenticated/collections",
        "/_authenticated/create-profile",
        "/_authenticated/downloads",
        "/_authenticated/settings",
        "/_authenticated/",
        "/_authenticated/profile/$id",
        "/_authenticated/workshop/search",
        "/_authenticated/workshop/",
        "/_authenticated/workshop/project/$id"
      ]
    },
    "/_authenticated/collection": {
      "filePath": "_authenticated/collection.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/collections": {
      "filePath": "_authenticated/collections.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/create-profile": {
      "filePath": "_authenticated/create-profile.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/downloads": {
      "filePath": "_authenticated/downloads.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/settings": {
      "filePath": "_authenticated/settings.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/": {
      "filePath": "_authenticated/index.lazy.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/profile/$id": {
      "filePath": "_authenticated/profile/$id.tsx",
      "parent": "/_authenticated",
      "children": [
        "/_authenticated/profile/$id/edit",
        "/_authenticated/profile/$id/screenshots"
      ]
    },
    "/_authenticated/workshop/search": {
      "filePath": "_authenticated/workshop/search.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/workshop/": {
      "filePath": "_authenticated/workshop/index.tsx",
      "parent": "/_authenticated"
    },
    "/_authenticated/profile/$id/edit": {
      "filePath": "_authenticated/profile/$id.edit.tsx",
      "parent": "/_authenticated/profile/$id"
    },
    "/_authenticated/profile/$id/screenshots": {
      "filePath": "_authenticated/profile/$id.screenshots.tsx",
      "parent": "/_authenticated/profile/$id"
    },
    "/_authenticated/workshop/project/$id": {
      "filePath": "_authenticated/workshop/project.$id.tsx",
      "parent": "/_authenticated"
    }
  }
}
ROUTE_MANIFEST_END */
