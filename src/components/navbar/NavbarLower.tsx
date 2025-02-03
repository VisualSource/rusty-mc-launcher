import { Link } from "@tanstack/react-router";
import {
	NavigationMenu,
	NavigationMenuContent,
	NavigationMenuItem,
	NavigationMenuList,
	NavigationMenuTrigger,
} from "@component/ui/navigation-menu";
import type { ModrinthSearchParams } from "@/routes/_authenticated/workshop/search/route";
import { Separator } from "@component/ui/separator";
import { Button } from "@component/ui/button";

export const NavbarLower: React.FC = () => {
	return (
		<section
			className="ml-2 flex h-14 items-center p-2 text-zinc-100"
			data-tauri-drag-region
		>
			<NavigationMenu>
				<NavigationMenuList>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							chevron={false}
							className="rounded-none bg-transparent px-2 hover:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-active:bg-transparent dark:data-[state=open]:bg-transparent"
						>
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
							<Button asChild className="w-full rounded-none" variant="ghost">
								<Link to="/">Home</Link>
							</Button>
							<Button className="w-full rounded-none" variant="ghost">
								<Link to="/collections">Collections</Link>
							</Button>
							<Separator />
							<Button className="w-full rounded-none" variant="ghost" asChild>
								<Link to="/downloads">Downloads</Link>
							</Button>
						</NavigationMenuContent>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							chevron={false}
							className="rounded-none bg-transparent px-2 hover:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-active:bg-transparent dark:data-[state=open]:bg-transparent"
						>
							<Link
								to="/skins"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								SKINS
							</Link>
						</NavigationMenuTrigger>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							chevron={false}
							className="rounded-none bg-transparent px-2 hover:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-active:bg-transparent dark:data-[state=open]:bg-transparent"
						>
							<Link
								to="/workshop/search"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
								search={{} as ModrinthSearchParams}
							>
								WORKSHOP
							</Link>
						</NavigationMenuTrigger>
					</NavigationMenuItem>
					<NavigationMenuItem>
						<NavigationMenuTrigger
							chevron={false}
							className="rounded-none bg-transparent px-2 hover:bg-transparent data-active:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-active:bg-transparent dark:data-[state=open]:bg-transparent"
						>
							<Link
								to="/downloads"
								activeProps={{
									className: "border-b-2 border-blue-300 text-blue-300",
								}}
							>
								DOWNLOADS
							</Link>
						</NavigationMenuTrigger>
					</NavigationMenuItem>
				</NavigationMenuList>
			</NavigationMenu>
		</section>
	);
};
