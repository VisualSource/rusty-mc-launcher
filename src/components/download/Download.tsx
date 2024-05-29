import { FileDiff, Monitor, PackagePlus } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import SectionDivider from "@component/download/SectionDivider";
import { useQueue, useCurrentQueue } from "@hook/useQueue";
import { TypographyMuted } from "@component/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { queryClient } from "@/lib/config/queryClient";
import { QueueItemState } from "@/lib/QueueItemState";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";
import { db } from "@/lib/system/commands";
import DownloadItem from "./DownloadItem";

const Download: React.FC = () => {
  const queueCompleted = useQueue(QueueItemState.COMPLETED);
  const queueErrored = useQueue(QueueItemState.ERRORED, "ASC");
  const queuePostponed = useQueue(QueueItemState.POSTPONED);
  const queueCurrent = useCurrentQueue();
  const queueNext = useQueue(QueueItemState.PENDING);
  const { progress } = useDownload();

  return (
    <div className="grid h-full w-full grid-cols-1 grid-rows-6 text-zinc-50">
      <div className="row-span-2 border-b border-b-blue-300 bg-blue-900/20 p-2">
        {queueCurrent.data && progress ? (
          <div className="flex gap-4">
            <Avatar className="h-32 w-32 rounded-none xl:h-60 xl:w-60">
              <AvatarFallback className="h-32 w-32 rounded-lg xl:h-60 xl:w-60">
                {queueCurrent.data.content_type === "Client" ? (
                  <Monitor className="h-24 w-24" />
                ) : queueCurrent.data.content_type === "Mod" ? (
                  <PackagePlus className="h-24 w-24" />
                ) : (
                  <FileDiff className="h-24 w-24" />
                )}
              </AvatarFallback>
              <AvatarImage src={queueCurrent.data.icon ?? undefined} />
            </Avatar>

            <div>
              <h1>{queueCurrent.data.display_name}</h1>
              <div>{progress.message}</div>
              <div>
                {progress.progress} of {progress.max_progress}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ScrollArea className="container row-span-4 py-2">
        {!queueNext.isError && !queueNext.isLoading ? (
          <section className="flex w-full flex-col">
            <SectionDivider
              label="Up Next"
              count={queueNext?.data?.length ?? 0}
            />
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueNext?.data?.length ? (
                queueNext?.data.map((item) => (
                  <DownloadItem key={item.id} {...item} />
                ))
              ) : (
                <TypographyMuted>
                  There are no downloads in queue
                </TypographyMuted>
              )}
            </div>
          </section>
        ) : null}

        {!queuePostponed.isError &&
          !queuePostponed.isLoading &&
          queuePostponed?.data?.length ? (
          <section className="flex w-full flex-col">
            <SectionDivider
              label="Postponed"
              count={queuePostponed.data.length}
            >
              <Button size="sm">Clear</Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queuePostponed.data.map((item) => (
                <DownloadItem key={item.id} {...item} />
              ))}
            </div>
          </section>
        ) : null}

        {!queueCompleted.isError &&
          !queueCompleted.isLoading &&
          queueCompleted?.data?.length ? (
          <section className="flex w-full flex-col">
            <SectionDivider
              label="Completed"
              count={queueCompleted.data.length}
            >
              <Button
                size="sm"
                onClick={() =>
                  db
                    .execute({
                      query:
                        "DELETE FROM download_queue WHERE state = 'COMPLETED'",
                    })
                    .then(() =>
                      queryClient.invalidateQueries({
                        queryKey: [KEY_DOWNLOAD_QUEUE, "COMPLETED"],
                      }),
                    )
                }
              >
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueCompleted.data.map((item) => (
                <DownloadItem key={item.id} {...item} />
              ))}
            </div>
          </section>
        ) : null}

        {!queueErrored.isError &&
          !queueErrored.isLoading &&
          queueErrored?.data?.length ? (
          <section className="flex flex-col">
            <SectionDivider label="Errored" count={queueErrored.data.length}>
              <Button
                size="sm"
                onClick={() =>
                  db
                    .execute({
                      query:
                        "DELETE FROM download_queue WHERE state = 'ERRORED';",
                    })
                    .then(() =>
                      queryClient.invalidateQueries({
                        queryKey: [KEY_DOWNLOAD_QUEUE, "ERRORED"],
                      }),
                    )
                }
              >
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueErrored.data.map((item) => (
                <DownloadItem key={item.id} {...item} />
              ))}
            </div>
          </section>
        ) : null}
      </ScrollArea>
    </div>
  );
};

export default Download;
