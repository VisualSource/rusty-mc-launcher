import SectionDivider from "@/components/download/SectionDivider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  TypographyH4,
  TypographyMuted,
  TypographySmall,
} from "@/components/ui/typography";
import {
  ClientMetadata,
  ModsMetadata,
  PackMetadata,
  QueueItem,
} from "@/lib/context/DownloadContext";
import useDownload from "@/lib/hooks/useDownload";
import useFormatSize from "@/lib/hooks/useFormatSize";
import { FileDiff, Monitor, PackagePlus } from "lucide-react";

const DownloadItem: React.FC<QueueItem> = ({ type, metadata, size }) => {
  const sizeFormat = useFormatSize();
  return (
    <div className="flex gap-2">
      <Avatar className="rounded-none">
        <AvatarFallback className="rounded-lg">
          {type === "client" ? (
            <Monitor />
          ) : type === "mods" ? (
            <PackagePlus />
          ) : (
            <FileDiff />
          )}
        </AvatarFallback>
        <AvatarImage />
      </Avatar>
      <div>
        {type === "client" ? (
          <div>
            <TypographyH4>
              Minecraft {(metadata as ClientMetadata).version}
            </TypographyH4>
          </div>
        ) : null}
        {type === "pack" ? (
          <div>
            <TypographyH4>
              Minecraft {(metadata as PackMetadata).name}
            </TypographyH4>
            <TypographyMuted>{sizeFormat(size)}</TypographyMuted>
          </div>
        ) : null}
        {type === "mods" ? (
          <div>
            <TypographyH4>Mods</TypographyH4>
            <TypographyMuted>
              {(metadata as ModsMetadata).mods.length} Mods
            </TypographyMuted>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const Download: React.FC = () => {
  const size = useFormatSize();
  const {
    queueCurrent,
    queueCompleted,
    queueNext,
    queueErrored,
    clearCompleted,
    clearErrored,
  } = useDownload();
  return (
    <div className="grid grid-rows-6 grid-cols-1 h-full text-zinc-50">
      <div className="row-span-2 bg-blue-900/20 p-2 border-b-blue-300 border-b">
        {queueCurrent ? (
          <div className="flex gap-4">
            <Avatar className="rounded-none h-32 w-32 xl:h-60 xl:w-60">
              <AvatarFallback className="rounded-lg h-32 w-32 xl:h-60 xl:w-60">
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
      <ScrollArea className="row-span-4 container py-2">
        <section className="flex flex-col w-full">
          <SectionDivider label="Up Next" count={queueNext.length} />
          <div className="flex flex-col pl-4 pt-2 gap-2">
            {queueNext.length ? (
              queueNext.map((item) => <DownloadItem {...item} />)
            ) : (
              <TypographyMuted>There are no downloads in queue</TypographyMuted>
            )}
          </div>
        </section>

        {queueCompleted.length ? (
          <section className="flex flex-col w-full">
            <SectionDivider label="Completed" count={queueCompleted.length}>
              <Button size="sm" onClick={() => clearCompleted()}>
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col pl-4 pt-2 gap-2">
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
            <div className="flex flex-col pl-4 pt-2 gap-2">
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
