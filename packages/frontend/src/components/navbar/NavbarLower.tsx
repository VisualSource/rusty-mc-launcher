import { Link } from "@tanstack/react-router";
import { memo } from "react";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
	NavigationMenuLink,
} from "@component/ui/navigation-menu";
import { Separator } from "@component/ui/separator";

export const NavbarLower: React.FC = memo(() => {
	return (
		<section className="ml-2 flex h-14 items-center p-2" data-tauri-drag-region>
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<NavigationMenuTrigger>
							<Link
								to="/"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								LIBRARY
							</Link>
						</NavigationMenuTrigger>
						<NavigationMenuContent>
							<ul>
								<li>
									<NavigationMenuLink asChild className="flex w-full">
										<Link className="flex" to="/">
											Home
										</Link>
									</NavigationMenuLink>
								</li>
								<li>
									<NavigationMenuLink asChild>
										<Link className="flex" to="/collections">
											Collections
										</Link>
									</NavigationMenuLink>
								</li>
								<li>
									<Separator />
								</li>
								<li>
									<NavigationMenuLink asChild>
										<Link className="flex" to="/downloads">
											Downloads
										</Link>
									</NavigationMenuLink>
								</li>
							</ul>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuLink asChild>
							<Link
								to="/skins"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								SKINS
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuLink asChild>
							<Link
								to="/workshop/search"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								WORKSHOP
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuLink asChild>
							<Link
								to="/downloads"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								DOWNLOADS
							</Link>
						</NavigationMenuLink>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		</section>
	);
});
NavbarLower.displayName = "NavbarLower";
