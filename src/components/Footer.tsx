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
import import_profiles from "@/lib/system/import_profiles";
import { Progress } from "@component/ui/progress";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";

const Footer = () => {
  const { queueCurrent } = useDownload();
  return (
    <footer className="flex h-16 bg-zinc-950 text-zinc-400 shadow flex-shrink-0 flex-grow-0">
      <div className="flex h-full w-full shrink items-center justify-start">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="group dark:hover:bg-transparent">
              <PlusSquare className="pr-2" />
              <TypographyMuted className="transition-colors dark:group-hover:text-zinc-300">
                Add a Game
              </TypographyMuted>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem asChild>
              <Link to="/create">Create Profile</Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={import_profiles}>
              Import Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex h-full w-full flex-1 items-center justify-center">
        <Button
          variant="ghost"
          className="hover:bg-transparent dark:hover:bg-transparent"
          asChild
        >
          <Link to="downloads" className="group">
            {queueCurrent ? (
              <div className="flex items-end gap-3">
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
                  <div className="flex w-full justify-between">
                    <TypographyMuted asChild className="line-clamp-1">
                      <span>{queueCurrent.msg}</span>
                    </TypographyMuted>
                    <TypographyMuted asChild>
                      <span>
                        {Math.floor(
                          100 *
                          (queueCurrent.ammount_current /
                            queueCurrent.ammount),
                        )}
                        %
                      </span>
                    </TypographyMuted>
                  </div>
                  <Progress
                    value={Math.floor(
                      100 *
                      (queueCurrent.ammount_current / queueCurrent.ammount),
                    )}
                  />
                </div>
              </div>
            ) : (
              <>
                <Download className="pr-2" />
                <TypographyMuted className="transition-colors dark:group-hover:text-zinc-300">
                  Manage Downloads
                </TypographyMuted>
              </>
            )}
          </Link>
        </Button>
      </div>

      <div className="flex h-full w-full shrink items-center justify-end"></div>
    </footer>
  );
};

export default Footer;
