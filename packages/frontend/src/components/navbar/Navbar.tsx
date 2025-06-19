import { memo } from "react";
import { NavbarLower } from "./NavbarLower";
import { NavbarUpper } from "./NavbarUpper";

const Navbar = memo(() => {
	return (
		<header
			className="z-50 shrink-0 grow-0 shadow-md border-b"
			data-tauri-drag-region
		>
			<NavbarUpper />
			<NavbarLower />
		</header>
	);
});

export default Navbar;
