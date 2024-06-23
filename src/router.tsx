import { createRouter, ErrorComponent } from "@tanstack/react-router";
import { queryClient } from "@lib/api/queryClient";

import { routeTree } from "./routeTree.gen";
import { Loader2 } from "lucide-react";

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: ({ error }) => <ErrorComponent error={error} />,
  defaultPendingComponent: () => (<div className="p-2 text-2xl"><div className="inline-block animate-spin px-2 transition opacity-1 duration-500 delay-300"><Loader2 /></div></div>),
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

/*import {
  createBrowserRouter,
  createRoutesFromElements,
  Navigate,
  Route,
} from "react-router-dom";

import CollectionsError from "./components/library/content/collections/CollectionsError";
import Collections from "./components/library/content/collections/Collections";
import ProfileCreate from "@component/library/content/profile/ProfileCreate";
import ProfileError from "@component/library/content/profile/ProfileError";
import ProfileEdit from "@component/library/content/profile/ProfileEdit";
import WorkshopProject from "@component/workshop/WorkshopProject";
import Profile from "@component/library/content/profile/Profile";
import WorkshopSearch from "@component/workshop/WorkshopSearch";
import WorkshopError from "@component/workshop/WorkshopError";
import LibraryRoot from "@component/library/LibraryRoot";
import Download from "@component/download/Download";
import Settings from "@component/settings/Settings";
import Library from "@component/library/Library";
import App from "@component/App";

import getModrinthProject from "./loaders/getModrinthProject";
import handleCollections from "./actions/handleCollection";
import getCollections from "./loaders/getCollections";
import modrinthSearch from "./loaders/modrinthSearch";
import updateProfile from "./actions/updateProfile";
import getProfile from "./loaders/getProfile";
import updateCollection from "./actions/updateCollection";
import Workshop from "./components/workshop/Workshop";
import ProfileContent from "./components/library/content/profile/ProfileContent";
import { Screenshots } from "./components/library/content/profile/Screenshots";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<Library />}>
        <Route
          path="/collection"
          element={<Navigate to="/" />}
          action={updateCollection}
        />
        <Route
          index
          element={<LibraryRoot />}
          errorElement={<ProfileError message="Failed to load root" />}
        />
        <Route
          path="/collections"
          action={handleCollections}
          loader={getCollections}
          element={<Collections />}
          errorElement={<CollectionsError />}
        />
        <Route
          path="/create"
          action={updateProfile}
          errorElement={<ProfileError message="Failed to open create" />}
          element={<ProfileCreate />}
        />
        <Route
          path="/profile/:id"
          errorElement={<ProfileError message="Failed to load profile." />}
          loader={getProfile}
          element={<Profile />}
        >
          <Route index element={<ProfileContent />} />
          <Route path="edit" action={updateProfile} element={<ProfileEdit />} />
          <Route path="screenshots" element={<Screenshots />} />
        </Route>
      </Route>

      <Route path="/settings" element={<Settings />} />

      <Route path="/downloads" element={<Download />} />

      <Route path="/workshop">
        <Route index element={<Workshop />} />

        <Route
          errorElement={<WorkshopError />}
          loader={modrinthSearch}
          path="search"
          element={<WorkshopSearch />}
        />
        <Route
          errorElement={<WorkshopError />}
          path=":uuid"
          loader={getModrinthProject}
          element={<WorkshopProject />}
        />
      </Route>
    </Route>,
  ),
);

export default router;*/
