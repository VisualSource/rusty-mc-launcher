import {
  FileDiff,
  Monitor,
  PackagePlus,
  RefreshCcw,
  Trash2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyH4 } from "@component/ui/typography";
import { QueueItem } from "@/lib/models/download_queue";
import { queryClient } from "@/lib/config/queryClient";
import { Button } from "../ui/button";
import { db } from "@system/commands";
import { KEY_DOWNLOAD_QUEUE } from "@/hooks/keys";
import { QueueItemState } from "@/lib/QueueItemState";

const DownloadItem: React.FC<QueueItem> = ({
  id,
  state,
  display_name,
  content_type,
  icon,
}) => {
  return (
    <div className="flex justify-between gap-2">
      <div className="flex items-center gap-2">
        <Avatar className="rounded-none">
          <AvatarFallback className="rounded-lg">
            {content_type === "Client" ? (
              <Monitor />
            ) : content_type === "Mod" ? (
              <PackagePlus />
            ) : (
              <FileDiff />
            )}
          </AvatarFallback>
          <AvatarImage className="rounded-md" src={icon ?? undefined} />
        </Avatar>
        <div>
          <TypographyH4 className="-mb-2">{display_name}</TypographyH4>
          <span className="text-sm text-zinc-400">{content_type}</span>
        </div>
      </div>

      {state === "COMPLETED" ? (
        <div>
          <Button
            onClick={async () => {
              await db.execute({
                query: "DELETE FROM download_queue WHERE id = ?",
                args: [id],
              });
              await queryClient.invalidateQueries({
                queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.COMPLETED],
              });
            }}
            size="icon"
            variant="destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ) : null}

      {state === "ERRORED" ? (
        <div className="flex gap-2">
          <Button
            onClick={async () => {
              await db.execute({
                query: "UPDATE download_queue SET state = ? WHERE id = ?",
                args: [QueueItemState.PENDING, id],
              });
              await queryClient.invalidateQueries({
                queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.PENDING],
              });
              await queryClient.invalidateQueries({
                queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
              });
            }}
            size="icon"
            variant="outline"
          >
            <RefreshCcw />
          </Button>
          <Button
            onClick={async () => {
              await db.execute({
                query: "DELETE FROM download_queue WHERE id = ?",
                args: [id],
              });
              await queryClient.invalidateQueries({
                queryKey: [KEY_DOWNLOAD_QUEUE, QueueItemState.ERRORED],
              });
            }}
            size="icon"
            variant="destructive"
          >
            <Trash2 />
          </Button>
        </div>
      ) : null}
    </div>
  );
};

export default DownloadItem;
