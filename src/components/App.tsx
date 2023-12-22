import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

function App() {
  return (
    <div className="grid main-layout h-full text-zinc-50">
      <Navbar />
      <main className="flex flex-col bg-zinc-900 row-span-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
