import { Routes, Route } from "react-router-dom";
import Navbar from "../components/navbar/NavbarComponent";
import Footer from "../components/footer/Footer";
import Download from "./download/Download";

import LibraryLayout from "./library/LayoutLibrary";
import Library from "./library/Library";
import LibraryView from "./library/View";

import Settings from "./settings/Settings";

import Mods from "./store/Mods";
import Modspacks from "./store/Modpacks";
import StoreLayout from "./store/StoreLayout";

import News from "./news/News";

import ProfileSelect from "../dialogs/ProfileSelect";
import CreateProfile from "./library/profilecreate";


export default function App() {
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/" element={<LibraryLayout/>}>
              <Route index element={<Library/>}/>
              <Route path="view/:uuid" element={<LibraryView/>} />
              <Route path="profile" element={<CreateProfile/>}/>
        </Route>
        <Route path="/download" element={<Download/>} />
        <Route path="/news" element={<News/>}/>
        <Route path="/store">
          <Route path="/store" element={<StoreLayout/>}>
          <Route path="mods" element={<Mods/>} />
          <Route path="modpacks" element={<Modspacks/>}/>
        </Route>
        </Route>
        <Route path="/settings">
            <Route index element={<Settings/>}/>
        </Route>
      </Routes>
      <Footer/>
      <ProfileSelect/>
    </>
  );
}

