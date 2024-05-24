import { FileDiff, Monitor, PackagePlus } from "lucide-react";
import { formatSize } from "@lib/size_format";

import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import SectionDivider from "@component/download/SectionDivider";
import { TypographyMuted } from "@component/ui/typography";
import { ScrollArea } from "@component/ui/scroll-area";
import { Button } from "@component/ui/button";
import useDownload from "@hook/useDownload";
import DownloadItem from "./DownloadItem";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/system/commands";
import { download_queue } from "@/lib/models/download_queue";
import { queryClient } from "@/lib/config/queryClient";

const size = (size: number) => formatSize(size, { space: true });

const DOWNLOAD_QUEUE_COMPLETED = "DOWNLOAD_QUEUE_COMPLETED";

const Download: React.FC = () => {
  const queueCurrent = useQuery({
    queryKey: ["DOWNLOAD_QUEUE_CURRENT"],
    initialData: null,
    refetchInterval: 60_000,
    queryFn: () => db.select({ schema: download_queue.schema, query: "SELECT * FROM download_queue WHERE state = 'CURRENT' LIMIT 1;", args: [] }).then(e => e.at(0) ?? null)
  });
  const queueNext = useQuery({
    queryKey: ["DOWNLOAD_QUEUE_PENDING"],
    refetchInterval: 60_000,
    queryFn: () => db.select({ schema: download_queue.schema, query: "SELECT * FROM download_queue WHERE state = 'PENDING' AND display = TRUE ORDER BY install_order DESC;", args: [] })
  });
  const queueCompleted = useQuery({
    queryKey: [DOWNLOAD_QUEUE_COMPLETED],
    refetchInterval: 60_000,
    queryFn: () => db.select({ schema: download_queue.schema, query: "SELECT * FROM download_queue WHERE state = 'COMPLETED' AND display = TRUE ORDER BY install_order ASC;", args: [] })
  });
  const queueErrored = useQuery({
    queryKey: ["DOWNLOAD_QUEUE_ERRORED"],
    refetchInterval: 60_000,
    queryFn: () => db.select({ schema: download_queue.schema, query: "SELECT * FROM download_queue WHERE state = 'ERRORED' AND display = TRUE ORDER BY install_order ASC;", args: [] })
  })
  const queuePostponed = useQuery({
    queryKey: ["DOWNLOAD_QUEUE_POSTPONED"],
    refetchInterval: 60_000,
    queryFn: () => db.select({ schema: download_queue.schema, query: "SELECT * FROM download_queue WHERE state = 'POSTPONED' AND display = TRUE ORDER BY install_order ASC;", args: [] })
  })

  return (
    <div className="grid h-full grid-cols-1 grid-rows-6 text-zinc-50 w-full">
      <div className="row-span-2 border-b border-b-blue-300 bg-blue-900/20 p-2">
        {queueCurrent.data ? (
          <div className="flex gap-4">
            <Avatar className="h-32 w-32 rounded-none xl:h-60 xl:w-60">
              <AvatarFallback className="h-32 w-32 rounded-lg xl:h-60 xl:w-60">
                {queueCurrent.data.content_type === "client" ? (
                  <Monitor className="h-24 w-24" />
                ) : queueCurrent.data.content_type === "mod" ? (
                  <PackagePlus className="h-24 w-24" />
                ) : (
                  <FileDiff className="h-24 w-24" />
                )}
              </AvatarFallback>
              <AvatarImage />
            </Avatar>

            <div>
              <div>
                {"C://"}:{" "}
                {size(1)}
              </div>
              <div>{"NO MSG"}</div>
              <div>
                {size(1)} of {size(1)}
              </div>
              <div>
                {0} of {0}
              </div>
            </div>
          </div>
        ) : null}
      </div>
      <ScrollArea className="container row-span-4 py-2">

        {!queueNext.isError && !queueNext.isLoading ? (
          <section className="flex w-full flex-col">
            <SectionDivider label="Up Next" count={queueNext?.data?.length ?? 0} />
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueNext?.data?.length ? (
                queueNext?.data.map((item) => <DownloadItem {...item} />)
              ) : (
                <TypographyMuted>There are no downloads in queue</TypographyMuted>
              )}
            </div>
          </section>
        ) : null}

        {!queuePostponed.isError && !queuePostponed.isLoading && queuePostponed?.data?.length ? (
          <section className="flex w-full flex-col">
            <SectionDivider label="Postponed" count={queuePostponed.data.length}>
              <Button size="sm">
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queuePostponed.data.map((item) => (
                <DownloadItem {...item} />
              ))}
            </div>
          </section>
        ) : null}

        {!queueCompleted.isError && !queueCompleted.isLoading && queueCompleted?.data?.length ? (
          <section className="flex w-full flex-col">
            <SectionDivider label="Completed" count={queueCompleted.data.length}>
              <Button size="sm" onClick={() =>
                db.execute({ query: "DELETE FROM download_queue WHERE state = 'COMPLETED'" })
                  .then(() => queryClient.invalidateQueries({ queryKey: [DOWNLOAD_QUEUE_COMPLETED] }))
              }>
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueCompleted.data.map((item) => (
                <DownloadItem {...item} />
              ))}
            </div>
          </section>
        ) : null}

        {!queueErrored.isError && !queueErrored.isLoading && queueErrored?.data?.length ? (
          <section className="flex flex-col">
            <SectionDivider label="Errored" count={queueErrored.data.length}>
              <Button size="sm" onClick={() => { }}>
                Clear
              </Button>
            </SectionDivider>
            <div className="flex flex-col gap-2 pl-4 pt-2">
              {queueErrored.data.map((item) => (
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
