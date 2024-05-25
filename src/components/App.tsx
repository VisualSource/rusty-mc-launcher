import { Outlet } from "react-router-dom";
import Navbar from "./navbar/Navbar";
import Footer from "./Footer";

function App() {
  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-zinc-950 text-zinc-50">
      <Navbar />
      <main className="flex basis-full overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default App;
