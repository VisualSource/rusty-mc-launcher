import { FileDiff, Monitor, PackagePlus } from "lucide-react";
import { formatSize } from "@lib/size_format";

import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import SectionDivider from "@component/download/SectionDivider";
import { TypographyMuted } from "@component/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";
import DownloadItem from "./DownloadItem";

const size = (size: number) => formatSize(size, { space: true });

const Download: React.FC = () => {
  const {
    queueCurrent,
    queueCompleted,
    queueNext,
    queueErrored,
    clearCompleted,
    clearErrored,
  } = useDownload();
  return (
    <div className="grid h-full grid-cols-1 grid-rows-6 text-zinc-50">
      <div className="row-span-2 border-b border-b-blue-300 bg-blue-900/20 p-2">
        {queueCurrent ? (
          <div className="flex gap-4">
            <Avatar className="h-32 w-32 rounded-none xl:h-60 xl:w-60">
              <AvatarFallback className="h-32 w-32 rounded-lg xl:h-60 xl:w-60">
                {queueCurrent.type === "client" ? (
                  <Monitor className="h-24 w-24" />
                ) : queueCurrent.type === "mods" ? (
                  <PackagePlus className="h-24 w-24" />
                ) : (
                  <FileDiff className="h-24 w-24" />
                )}
              </AvatarFallback>
              <AvatarImage />
            </Avatar>

            <div>
              <div>
                {queueCurrent.download?.file}:{" "}
                {size(queueCurrent.download?.size ?? 0)}
              </div>
              <div>{queueCurrent.msg}</div>
              <div>
                {size(queueCurrent.size_current)} of {size(queueCurrent.size)}
              </div>
              <div>
                {queueCurrent.ammount_current} of {queueCurrent.ammount}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ScrollArea className="container row-span-4 py-2">
        <section className="flex w-full flex-col">
          <SectionDivider label="Up Next" count={queueNext.length} />
          <div className="flex flex-col gap-2 pl-4 pt-2">
            {queueNext.length ? (
              queueNext.map((item) => <DownloadItem {...item} />)
            ) : (
              <TypographyMuted>There are no downloads in queue</TypographyMuted>
            )}
          </div>
        </section>

        {queueCompleted.length ? (
          <section className="flex w-full flex-col">
            <SectionDivider label="Completed" count={queueCompleted.length}>
              <Button size="sm" onClick={() => clearCompleted()}>
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueCompleted.map((item) => (
                <DownloadItem {...item} />
              ))}
            </div>
          </section>
        ) : null}

        {queueErrored.length ? (
          <section className="flex flex-col">
            <SectionDivider label="Errored" count={queueErrored.length}>
              <Button size="sm" onClick={() => clearErrored()}>
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueErrored.map((item) => (
                <DownloadItem {...item} />
              ))}
            </div>
          </section>
        ) : null}
      </ScrollArea>
    </div>
  );
};

export default Download;
