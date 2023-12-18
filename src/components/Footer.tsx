import { Download, PlusSquare } from "lucide-react";
import { Link } from "react-router-dom";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TypographyMuted } from "./ui/typography";
import { Button } from "./ui/button";

const Footer = () => {
    return (
        <footer className="flex h-16 bg-zinc-950 shadow text-zinc-400">
            <div className="h-full flex justify-start items-center shrink w-full">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="dark:hover:bg-transparent">
                            <PlusSquare className="pr-2" />
                            <TypographyMuted>Add a Game</TypographyMuted>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem>Add Profile</DropdownMenuItem>
                        <DropdownMenuItem>Import Profile</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

            </div>

            <div className="h-full flex items-center justify-center flex-1 w-full">
                <Button variant="ghost" className="hover:bg-transparent dark:hover:bg-transparent" asChild>
                    <Link to="downloads">
                        <Download className="pr-2" />
                        <TypographyMuted>Manage Downloads</TypographyMuted>
                    </Link >
                </Button>
            </div>

            <div className="h-full flex items-center justify-end shrink w-full"></div>
        </footer >
    );
}

export default Footer;