import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "@component/App";
import Home from "@page/Home";

import ProfileCreate from "./pages/ProfileCreate";
import DownloadsPage from "./pages/Downloads";
import ProfilePage from "./pages/ProfilePage";
import Settings from "./pages/Settings";
import Library from "./pages/Library";
import ModPage from "./pages/ModPage";
import Mods from "./pages/Mods";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={< App />}>
      <Route path="/" element={<Home />} />
      <Route path="/downloads" element={<DownloadsPage />} />
      <Route path="/library" element={<Library />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile/create" element={<ProfileCreate />} />
      <Route path="/profile/:id" element={<ProfilePage />} />
      <Route path="/mods" element={<Mods />} />
      <Route path="/mod/:uuid" element={<ModPage />} />
    </Route>
  )
);

export default router;