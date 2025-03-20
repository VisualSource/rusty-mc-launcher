import {
	AuthenticatedTemplate,

	UnauthenticatedTemplate,

} from "@azure/msal-react";
import {
	Minus,
	X,
	Maximize,
	Minimize,
	Hexagon,
	User2,
	ChevronDown,
	Settings,
	Users2,
	LogIn,
	LogOut,
	DoorOpen,
	Bug,
	ScrollText,
} from "lucide-react";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { exit } from "@tauri-apps/plugin-process";
import { Link } from "@tanstack/react-router";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@component/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";

import { useIsMaximized } from "@hook/useIsMaximized";
import { Notifications } from "./Notifications";
import { Button } from "@component/ui/button";
import useUser from "@/hooks/useUser";

const appWindow = getCurrentWebviewWindow();

export const NavbarUpper: React.FC = () => {
	const isMaximized = useIsMaximized();
	const { account, isLoading, logout, login } = useUser();


	return (
		<section
			className="flex h-9 justify-between px-1 pt-1"
			data-tauri-drag-region
		>
			<div className="flex h-full" data-tauri-drag-region>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost" className="h-full rounded-none">
							<Hexagon className="pr-2" />
							MCL
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<DropdownMenuItem asChild>
							<Link to="/settings">
								<Settings className="h-4 w-4 mr-2" />
								Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Link to="/bug-report" className="flex items-center">
								<Bug className="h-4 w-4 mr-2" />
								Bug Report
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={() => exit()}>
							<DoorOpen className="h-4 w-4 mr-2" />
							Exit
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="sm" variant="ghost" className="h-full rounded-none">
							View
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem>
							<Link to="/patch-notes" className="flex items-center">
								<ScrollText className="h-4 w-4 mr-2" />
								Patch Notes
							</Link>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
			<div className="flex h-full" data-tauri-drag-region>
				<Notifications />

				<Avatar className="h-8 rounded-none rounded-s-lg border-y border-l">
					<AvatarImage
						src={
							account
								? `https://visage.surgeplay.com/face/256/${account.id}`
								: undefined
						}
					/>
					<AvatarFallback className="rounded-none">
						<User2 />
					</AvatarFallback>
				</Avatar>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<button
							className="mr-2 flex items-center rounded-s-none justify-center bg-white px-3 text-black"
							type="button"
						>
							<span className="mr-1 text-sm">
								{isLoading ? "Loading" : account?.name ?? account?.username ?? "Login"}
							</span>
							<ChevronDown className="h-4 w-4" />
						</button>
					</DropdownMenuTrigger>
					<DropdownMenuContent>
						<UnauthenticatedTemplate>
							<DropdownMenuItem onClick={() => {
								debugger;
								login().catch(e => console.error(e));
							}}>
								<LogIn className="h-4 w-4 mr-2" />
								Login
							</DropdownMenuItem>
						</UnauthenticatedTemplate>
						<AuthenticatedTemplate>
							<DropdownMenuItem asChild>
								<Link to="/settings/accounts">
									<Users2 className="h-4 w-4 mr-2" />
									Accounts
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => logout()}>
								<LogOut className="h-4 w-4 mr-2" /> Signout
							</DropdownMenuItem>
						</AuthenticatedTemplate>
					</DropdownMenuContent>
				</DropdownMenu>

				<div className="flex h-8">
					<Button
						variant="ghost"
						size="icon"
						className="flex h-8 flex-col justify-end rounded-none"
						onClick={() => appWindow.minimize()}
					>
						<Minus className="h-5 w-5" />
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 rounded-none"
						onClick={() => appWindow.toggleMaximize()}
					>
						{isMaximized ? (
							<Minimize className="h-5 w-5" />
						) : (
							<Maximize className="h-5 w-5" />
						)}
					</Button>
					<Button
						variant="ghost"
						size="icon"
						className="h-8 rounded-none hover:bg-red-500/90 dark:hover:bg-red-900/90"
						onClick={() => appWindow.close()}
					>
						<X className="h-5 w-5" />
					</Button>
				</div>
			</div>
		</section>
	);
};
