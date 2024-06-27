import { Gamepad2, HardDriveDownload, LaptopMinimal, Users2 } from "lucide-react";
import { Link, Outlet, createFileRoute, useLocation } from "@tanstack/react-router";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/settings")({
	component: Settings,
});

function Settings() {
	const location = useLocation();

	return (
		<div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 h-full">
			<aside className="-mx-4 lg:w-1/5 px-10 py-10">
				<nav className="flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1">
					<Link className={cn(buttonVariants({ variant: "ghost" }), location.pathname === "/settings" ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline", "justify-start")} to="/settings"><LaptopMinimal className="pr-2" /> System</Link>
					<Link className={cn(buttonVariants({ variant: "ghost" }), location.pathname === "/settings/game" ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline", "justify-start")} to="/settings/game"><Gamepad2 className="pr-2" /> Game</Link>
					<Link className={cn(buttonVariants({ variant: "ghost" }), location.pathname === "/settings/accounts" ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline", "justify-start")} to="/settings/accounts"><Users2 className="pr-2" /> Accounts</Link>
					<Link className={cn(buttonVariants({ variant: "ghost" }), location.pathname === "/settings/download" ? "bg-muted hover:bg-muted" : "hover:bg-transparent hover:underline", "justify-start")} to="/settings/download"><HardDriveDownload className="pr-2" /> Downloads</Link>
				</nav>
			</aside>
			<div className="flex-1 pr-10 overflow-y-scroll h-full scrollbar">
				<Outlet />
			</div>
		</div>
	);
}