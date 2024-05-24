import { formatSize } from "@lib/size_format";
import { FileDiff, Monitor, PackagePlus } from "lucide-react";


import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyH4, TypographyMuted } from "@component/ui/typography";
import { QueueItem } from "@/lib/models/download_queue";

const DownloadItem: React.FC<QueueItem> = ({ display_name, content_type, metadata }) => {
  return (
    <div className="flex gap-2">
      <Avatar className="rounded-none">
        <AvatarFallback className="rounded-lg">
          {content_type === "client" ? (
            <Monitor />
          ) : content_type === "mod" ? (
            <PackagePlus />
          ) : (
            <FileDiff />
          )}
        </AvatarFallback>
        <AvatarImage />
      </Avatar>
      <div>
        <div>
          <TypographyH4>
            {display_name}
          </TypographyH4>
          {content_type === "resource" || content_type === "shader" ? (
            <TypographyMuted>
              {formatSize(metadata.size as number ?? 0, { space: true })}
            </TypographyMuted>
          ) : null}
          {content_type === "mod" ? (
            <TypographyMuted>
              {metadata?.name as string}
            </TypographyMuted>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DownloadItem;
