import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

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

import getFavoritedProfiles from "./loaders/getFavoritedProfiles";
import getModrinthProject from "./loaders/getModrinthProject";
import modrinthSearch from "./loaders/modrinthSearch";
import updateProfile from "./actions/updateProfile";
import getProfile from "./loaders/getProfile";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<Library />}>
        <Route
          index
          loader={getFavoritedProfiles}
          element={<LibraryRoot />}
          errorElement={<ProfileError />}
        />
        <Route
          path="/create"
          action={updateProfile}
          errorElement={<ProfileError />}
          element={<ProfileCreate />}
        />
        <Route
          path="/profile/:id"
          errorElement={<ProfileError />}
          loader={getProfile}
          element={<Profile />}
        />
        <Route
          path="/profile/edit/:id"
          action={updateProfile}
          errorElement={<ProfileError />}
          loader={getProfile}
          element={<ProfileEdit />}
        />
      </Route>

      <Route path="/settings" element={<Settings />} />

      <Route path="/downloads" element={<Download />} />
      <Route path="/workshop">
        <Route
          errorElement={<WorkshopError />}
          loader={modrinthSearch}
          index
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

export default router;
