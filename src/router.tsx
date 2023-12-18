import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";

import ModrinthBoundaryError from "./components/workshop/ModrinthBoundaryError";
import WorkshopIndex from "./components/workshop/WorkshopIndex";
import ModrinthPage from "./components/workshop/ModrinthPage";
import Workshop from "@page/Workshop";
import Settings from "@page/Settings";
import Library from "@page/Library";
import App from "@component/App";

import modrinthSearch from "./loaders/modrinthSearch";
import loadModrinthPage from "./loaders/modrinth";
import loadProfile from "./loaders/profile";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={< App />}>

      <Route path="/" element={<Library />}>
        <Route path="/create" element={<></>} />
        <Route path="/profile/:id" loader={loadProfile} element={<></>} />
      </Route>

      <Route path="/settings" element={<Settings />}>
        <Route path="info"></Route>
        <Route path="config"></Route>
      </Route>

      <Route path="/downloads" element={<></>} />

      <Route path="/workshop" element={<Workshop />}>
        <Route errorElement={<ModrinthBoundaryError />} loader={modrinthSearch} index element={<WorkshopIndex />} />
        <Route errorElement={<ModrinthBoundaryError />} path=":uuid" loader={loadModrinthPage} element={<ModrinthPage />} />
      </Route>
    </Route>
  )
);

export default router;