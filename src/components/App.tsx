import { Outlet } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./Footer";

function App() {
  return (
    <div className="flex flex-col text-zinc-50 flex-1 overflow-hidden">
      <Navbar />
      <main className="flex bg-zinc-900 overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
