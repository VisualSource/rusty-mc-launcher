import { Outlet } from "react-router-dom";
import Footer from "./Footer";
import Navbar from "./Navbar";

function App() {
  return (
    <div className="flex flex-col h-full">
      <Navbar />
      <main className="flex flex-col flex-1 bg-zinc-900 overflow-hidden">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default App
