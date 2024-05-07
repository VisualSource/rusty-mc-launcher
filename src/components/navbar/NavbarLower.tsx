
import { Link, NavLink } from "react-router-dom";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@component/ui/navigation-menu";
import { Separator } from "@component/ui/separator";
import { Button } from "@component/ui/button";
import { cn } from "@/lib/utils";

export const NavbarLower: React.FC = () => {
    return (
        <section className="h-14 flex items-center p-2 text-zinc-100 ml-2" data-tauri-drag-region>
            <NavigationMenu>
                <NavigationMenuList>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger
                            showIcon={false}
                            className="rounded-none px-2 bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-[active]:bg-transparent dark:data-[state=open]:bg-transparent"
                        >
                            <NavLink
                                to=""
                                className={({ isActive }) =>
                                    cn("transition-colors", {
                                        "border-b-2 border-blue-300 text-blue-300": isActive,
                                    })
                                }
                            >
                                LIBRARY
                            </NavLink>
                        </NavigationMenuTrigger>
                        <NavigationMenuContent>
                            <Button
                                asChild
                                className="w-full rounded-none"
                                variant="ghost"
                            >
                                <Link to="/">Home</Link>
                            </Button>
                            <Button className="w-full rounded-none" variant="ghost">
                                <Link to="/collections">Collections</Link>
                            </Button>
                            <Separator />
                            <Button
                                className="w-full rounded-none"
                                variant="ghost"
                                asChild
                            >
                                <Link to="/downloads">Downloads</Link>
                            </Button>
                        </NavigationMenuContent>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger
                            showIcon={false}
                            className="rounded-none px-2 bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-[active]:bg-transparent dark:data-[state=open]:bg-transparent"
                        >
                            <NavLink
                                to="workshop"
                                className={({ isActive }) =>
                                    cn("transition-colors", {
                                        "border-b-2 border-blue-300 text-blue-300": isActive,
                                    })
                                }
                            >
                                WORKSHOP
                            </NavLink>
                        </NavigationMenuTrigger>
                    </NavigationMenuItem>
                    <NavigationMenuItem>
                        <NavigationMenuTrigger
                            showIcon={false}
                            className="rounded-none px-2 bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent dark:bg-transparent dark:hover:bg-transparent dark:data-[active]:bg-transparent dark:data-[state=open]:bg-transparent"
                        >
                            <NavLink
                                to="downloads"
                                className={({ isActive }) =>
                                    cn("transition-colors", {
                                        "border-b-2 border-blue-300 text-blue-300": isActive,
                                    })
                                }
                            >
                                DOWNLOADS
                            </NavLink>
                        </NavigationMenuTrigger>
                    </NavigationMenuItem>
                </NavigationMenuList>
            </NavigationMenu>
        </section>
    );
}