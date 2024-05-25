import {
  Download,
  FileDiff,
  Monitor,
  PackagePlus,
  PlusSquare,
} from "lucide-react";
import { downloadDir } from "@tauri-apps/api/path";
import { open } from "@tauri-apps/api/dialog";
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
import { useCurrentQueue } from "@/hooks/useQueue";
import { Progress } from "@component/ui/progress";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";

async function import_mrpack() {
  const result = await open({
    multiple: false,
    defaultPath: await downloadDir(),
    title: "Import Mrpack",
    filters: [
      {
        name: "Mrpack",
        extensions: ["mrpack"],
      },
    ],
  });

  console.log(result);
}

const Footer = () => {
  const { progress } = useDownload();
  const queueCurrent = useCurrentQueue();
  return (
    <footer className="flex h-16 flex-shrink-0 flex-grow-0 bg-zinc-950 text-zinc-400 shadow">
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
            <DropdownMenuItem onClick={import_mrpack}>
              Import Mrpack
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
            {queueCurrent.data && progress ? (
              <div className="flex items-center gap-3">
                <Avatar className="rounded-none">
                  <AvatarFallback className="rounded-lg">
                    {queueCurrent.data?.content_type === "client" ? (
                      <Monitor />
                    ) : queueCurrent?.data?.content_type === "mod" ? (
                      <PackagePlus />
                    ) : (
                      <FileDiff />
                    )}
                  </AvatarFallback>
                  <AvatarImage src={queueCurrent.data.icon ?? undefined} />
                </Avatar>
                <div className="w-96">
                  <div className="flex w-full justify-between">
                    <TypographyMuted asChild className="mb-1 line-clamp-1">
                      <span>{progress.message}</span>
                    </TypographyMuted>
                    <TypographyMuted asChild>
                      <span>
                        {Math.floor(
                          100 * (progress.progress / progress.max_progress),
                        )}
                        %
                      </span>
                    </TypographyMuted>
                  </div>
                  <Progress
                    value={Math.floor(
                      100 * (progress.progress / progress.max_progress),
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
