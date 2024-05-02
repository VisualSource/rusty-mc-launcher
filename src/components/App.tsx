import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

function App() {
  return (
    <div className="main-layout grid h-full text-zinc-50">
      <Navbar />
      <main className="row-span-1 flex flex-col bg-zinc-900">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
