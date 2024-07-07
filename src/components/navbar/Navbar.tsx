import { memo } from "react";
import { NavbarLower } from "./NavbarLower";
import { NavbarUpper } from "./NavbarUpper";

const Navbar = memo(() => {
	return (
		<header
			className="z-50 flex-shrink-0 flex-grow-0 bg-zinc-950 text-zinc-400 shadow-md"
			data-tauri-drag-region
		>
			<NavbarUpper />
			<NavbarLower />
		</header>
	);
});

export default Navbar;
