import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import ModrinthBoundaryError from "./components/workshop/ModrinthBoundaryError";
import WorkshopIndex from "./components/workshop/WorkshopIndex";
import ProfileCreate from "./components/library/ProfileCreate";
import ModrinthPage from "./components/workshop/ModrinthPage";
import ProfileError from "./components/library/ProfileError";
import LibraryRoot from "./components/library/LibraryRoot";
import ProfileEdit from "./components/library/ProfileEdit";
import Profile from "./components/library/Profile";
import Workshop from "@page/Workshop";
import Settings from "@page/Settings";
import Library from "@page/Library";
import App from "@component/App";

import modrinthSearch from "./loaders/modrinthSearch";
import loadModrinthPage from "./loaders/modrinth";
import loadProfile from "./loaders/profile";
import librarydata from "./loaders/librarydata";
import updateProfile from "./actions/updateProfile";
import Download from "./pages/Download";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<Library />}>
        <Route
          index
          loader={librarydata}
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
          loader={loadProfile}
          element={<Profile />}
        />
        <Route
          path="/profile/edit/:id"
          action={updateProfile}
          errorElement={<ProfileError />}
          loader={loadProfile}
          element={<ProfileEdit />}
        />
      </Route>

      <Route path="/settings" element={<Settings />} />

      <Route path="/downloads" element={<Download />} />
      <Route path="/workshop" element={<Workshop />}>
        <Route
          errorElement={<ModrinthBoundaryError />}
          loader={modrinthSearch}
          index
          element={<WorkshopIndex />}
        />
        <Route
          errorElement={<ModrinthBoundaryError />}
          path=":uuid"
          loader={loadModrinthPage}
          element={<ModrinthPage />}
        />
      </Route>
    </Route>,
  ),
);

export default router;
