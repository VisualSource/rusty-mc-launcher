import { Outlet } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./Footer";

function App() {
  return (
    <div className="flex flex-col text-zinc-50 flex-1 overflow-hidden bg-zinc-950">
      <Navbar />
      <main className="flex overflow-hidden" style={{ flexBasis: "100%" }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
