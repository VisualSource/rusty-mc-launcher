import {
  Download,
  FileDiff,
  Monitor,
  PackagePlus,
  PlusSquare,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@component/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyMuted } from "@component/ui/typography";
import { Progress } from "@component/ui/progress";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";

const Footer = () => {
  const { queueCurrent } = useDownload();
  return (
    <footer className="flex h-16 bg-zinc-950 shadow text-zinc-400 row-span-1">
      <div className="h-full flex justify-start items-center shrink w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="dark:hover:bg-transparent">
              <PlusSquare className="pr-2" />
              <TypographyMuted>Add a Game</TypographyMuted>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to="/create">Create Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Import Profile</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="h-full flex items-center justify-center flex-1 w-full">
        <Button
          variant="ghost"
          className="hover:bg-transparent dark:hover:bg-transparent"
          asChild
        >
          <Link to="downloads">
            {queueCurrent ? (
              <div className="flex gap-3 items-end">
                <Avatar className="rounded-none">
                  <AvatarFallback className="rounded-lg">
                    {queueCurrent.type === "client" ? (
                      <Monitor />
                    ) : queueCurrent.type === "mods" ? (
                      <PackagePlus />
                    ) : (
                      <FileDiff />
                    )}
                  </AvatarFallback>
                  <AvatarImage />
                </Avatar>
                <div className="w-96">
                  <div className="w-full flex justify-between">
                    <TypographyMuted asChild className="line-clamp-1">
                      <span>{queueCurrent.msg}</span>
                    </TypographyMuted>
                    <TypographyMuted asChild>
                      <span>{100 * (queueCurrent.ammount_current / 100)}%</span>
                    </TypographyMuted>
                  </div>
                  <Progress
                    value={100 * (queueCurrent.ammount_current / 100)}
                  />
                </div>
              </div>
            ) : (
              <>
                <Download className="pr-2" />
                <TypographyMuted>Manage Downloads</TypographyMuted>
              </>
            )}
          </Link>
        </Button>
      </div>

      <div className="h-full flex items-center justify-end shrink w-full"></div>
    </footer>
  );
};

export default Footer;
