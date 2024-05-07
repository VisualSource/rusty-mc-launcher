import { NavbarLower } from "./NavbarLower";
import { NavbarUpper } from "./NavbarUpper";

const Navbar = () => {
    return (
        <header className="z-50 bg-zinc-950 text-zinc-400 shadow-md flex-shrink-0 flex-grow-0" data-tauri-drag-region>
            <NavbarUpper />
            <NavbarLower />
        </header>
    );
}

export default Navbar;