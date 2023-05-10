import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import App from "@component/App";
import Home from "@page/Home";
import DownloadsPage from "./pages/Downloads";
import Library from "./pages/Library";
import Settings from "./pages/Settings";
import ProfileCreate from "./pages/ProfileCreate";
import ProfilePage from "./pages/ProfilePage";

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={< App />}>
      <Route path="/" element={<Home />} />
      <Route path="/downloads" element={<DownloadsPage />} />
      <Route path="/library" element={<Library />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="/profile/create" element={<ProfileCreate />} />
      <Route path="profile/:id" element={<ProfilePage />} />
    </Route>
  )
);

export default router;