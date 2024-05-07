import { AuthenticatedTemplate, useAccount, UnauthenticatedTemplate } from "@azure/msal-react";
import { Minus, X, Maximize, Minimize, Hexagon, User2, ChevronDown } from "lucide-react";
import { appWindow } from "@tauri-apps/api/window";
import { exit } from "@tauri-apps/api/process";
import { Link } from "react-router-dom";

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@component/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { useIsMaximized } from "@hook/useIsMaximized";
import { Notifications } from "./Notifications";
import { useAvatar } from "@/hooks/useAvatar";
import { Button } from "@component/ui/button";
import useUser from "@/hooks/useUser";

export const NavbarUpper: React.FC = () => {
    const isMaximized = useIsMaximized();
    const msAccount = useAccount();
    const { account, logout, login } = useUser();
    const avatar = useAvatar();
    return (
        <section className="h-9 flex justify-between pt-1 px-1" data-tauri-drag-region>
            <div className="flex h-full" data-tauri-drag-region>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-full rounded-none">
                            <Hexagon className="pr-2" />
                            MCL
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem asChild>
                            <Link to="settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => exit()}>Exit</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm" variant="ghost" className="h-full rounded-none">
                    View
                </Button>
            </div>
            <div className="flex h-full" data-tauri-drag-region>

                <Notifications />

                <Avatar className="rounded-none h-8">
                    <AvatarImage src={avatar?.data} />
                    <AvatarFallback className="rounded-none">
                        <User2 />
                    </AvatarFallback>
                </Avatar>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex justify-center items-center bg-white text-black px-3 mr-2">
                            <span className="text-sm mr-1">{account?.details.name}</span>
                            <ChevronDown className="h-4 w-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <UnauthenticatedTemplate>
                            <DropdownMenuItem onClick={() => login()}>Logint</DropdownMenuItem>
                        </UnauthenticatedTemplate>
                        <AuthenticatedTemplate>
                            <DropdownMenuItem onClick={() => logout(msAccount)}>Signout</DropdownMenuItem>
                        </AuthenticatedTemplate>
                    </DropdownMenuContent>
                </DropdownMenu>

                <div className="h-8 flex">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none h-8 flex flex-col justify-end"
                        onClick={() => appWindow.minimize()}
                    >
                        <Minus className="h-5 w-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none h-8"
                        onClick={() => appWindow.toggleMaximize()}>
                        {isMaximized ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-none hover:bg-red-500/90 dark:hover:bg-red-900/90 h-8"
                        onClick={() => appWindow.close()}>
                        <X className="h-5 w-5" />
                    </Button>
                </div>

            </div>
        </section>
    );
}