import {
  Minus,
  X,
  Maximize,
  Minimize,
  Hexagon,
  User2,
  Bell,
  Archive,
} from "lucide-react";
import { useNotificationCenter } from "react-toastify/addons/use-notification-center";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
} from "@azure/msal-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatRelative } from "date-fns/formatRelative";
import { appWindow } from "@tauri-apps/api/window";
import { Link, NavLink } from "react-router-dom";
import { exit } from "@tauri-apps/api/process";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@component/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@component/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@component/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@component/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyH4, TypographyMuted } from "@component/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { Separator } from "@component/ui/separator";
import type ToastData from "@/types/toastData";
import { Button } from "@component/ui/button";
import useUser from "@hook/useUser";
import { cn } from "@lib/utils";

const Navbar = () => {
  const { notifications, markAllAsRead, remove, clear } =
    useNotificationCenter<ToastData>();
  const { data: isMaximized } = useQuery({
    queryKey: ["isMaximized"],
    queryFn: () => appWindow.isMaximized(),
    networkMode: "offlineFirst",
  });
  const { user, isLoading, logout, login } = useUser();
  const queryClient = useQueryClient();

  return (
    <TooltipProvider>
      <header
        data-tauri-drag-region
        className="z-50 bg-zinc-950 text-zinc-400 shadow-md row-span-1"
      >
        <section data-tauri-drag-region className="flex justify-between">
          <div className="flex">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-none h-full"
                >
                  <Hexagon className="pr-2" />
                  MCL
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => logout()}>
                  Sign Out...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => exit()}>Exit</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button size="sm" variant="ghost" className="rounded-none h-full">
              View
            </Button>
          </div>
          <div className="flex">
            <Popover>
              <PopoverTrigger asChild>
                <div className="flex justify-center items-center pr-2">
                  <Button size="icon" variant="secondary">
                    <Bell className="h-5 w-5" />
                  </Button>
                </div>
              </PopoverTrigger>
              <PopoverContent align="end" sideOffset={4} className="w-80">
                <div className="flex justify-between">
                  <TypographyH4>Notifications</TypographyH4>
                  <Button variant="secondary" size="sm">
                    View All
                  </Button>
                </div>
                <ScrollArea className="max-h-56 pt-4">
                  <ul className="min-h-[200px] space-y-2">
                    {notifications.map((value) => (
                      <li
                        key={value.id}
                        className="py-1 px-4 rounded-md bg-zinc-700 flex justify-between items-center"
                      >
                        {(value.icon as React.ReactNode) ?? null}
                        <div>
                          <div className="line-clamp-1 font-medium">
                            {value.content as React.ReactNode}
                          </div>
                          <TypographyMuted asChild>
                            <span>
                              {formatRelative(
                                new Date(value.createdAt),
                                new Date(),
                              )}
                            </span>
                          </TypographyMuted>
                        </div>
                        <Button
                          title="Archive notification"
                          onClick={() => remove(value.id)}
                          size="icon"
                          variant="destructive"
                        >
                          <Archive />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
                <Separator className="mb-4" />
                <div className="flex justify-between">
                  <Button size="sm" onClick={() => clear()}>
                    Clear All
                  </Button>
                  <Button size="sm" onClick={() => markAllAsRead()}>
                    Mark All Read
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <div>
                    <div className="flex pr-2">
                      <Avatar className="rounded-none h-9">
                        <AvatarImage className="h-full" src={user?.photo} />
                        <AvatarFallback className="rounded-none">
                          <User2 />
                        </AvatarFallback>
                      </Avatar>
                      <AuthenticatedTemplate>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            className="rounded-none line-clamp-1 h-9"
                          >
                            {user?.displayName ?? "Username"}
                          </Button>
                        </DropdownMenuTrigger>
                      </AuthenticatedTemplate>
                      <UnauthenticatedTemplate>
                        <Button
                          disabled={isLoading}
                          onClick={() => login()}
                          size="sm"
                          className="rounded-none"
                        >
                          {isLoading ? "Login" : "Loading..."}
                        </Button>
                      </UnauthenticatedTemplate>
                    </div>
                    <AuthenticatedTemplate>
                      <DropdownMenuContent>
                        <DropdownMenuItem>Signout</DropdownMenuItem>
                      </DropdownMenuContent>
                    </AuthenticatedTemplate>
                  </div>
                </TooltipTrigger>
              </DropdownMenu>
              <TooltipContent>
                <p>Mannage Account</p>
              </TooltipContent>
            </Tooltip>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none"
              onClick={() => appWindow.minimize()}
            >
              <Minus />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none"
              onClick={() =>
                appWindow.toggleMaximize().then(() =>
                  queryClient.invalidateQueries({
                    queryKey: ["isMaximized"],
                  }),
                )
              }
            >
              {isMaximized ? <Minimize /> : <Maximize />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-none hover:bg-red-500/90 dark:hover:bg-red-900/90"
              onClick={() => appWindow.close()}
            >
              <X />
            </Button>
          </div>
        </section>
        <section
          data-tauri-drag-region
          aria-label="Page Header"
          className="p-2 flex items-center text-zinc-100"
        >
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger
                  showIcon={false}
                  className="rounded-none bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent data-[active]:bg-transparent dark:data-[active]:bg-transparent data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent"
                >
                  <NavLink
                    to=""
                    className={({ isActive }) =>
                      cn({
                        "text-blue-300 border-b-2 border-blue-300": isActive,
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
                  className="rounded-none bg-transparent dark:bg-transparent hover:bg-transparent dark:hover:bg-transparent data-[active]:bg-transparent dark:data-[active]:bg-transparent data-[state=open]:bg-transparent dark:data-[state=open]:bg-transparent"
                >
                  <NavLink
                    to="workshop"
                    className={({ isActive }) =>
                      cn({
                        "text-blue-300 border-b-2 border-blue-300": isActive,
                      })
                    }
                  >
                    COMMUNITY
                  </NavLink>
                </NavigationMenuTrigger>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </section>
      </header>
    </TooltipProvider>
  );
};

export default Navbar;
