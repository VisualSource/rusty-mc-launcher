import FileSizeFormat from "@saekitominaga/file-size-format";
import { FileDiff, Monitor, PackagePlus } from "lucide-react";

import type {
  ClientMetadata,
  ModsMetadata,
  PackMetadata,
  QueueItem,
} from "@lib/context/DownloadContext";
import { Avatar, AvatarFallback, AvatarImage } from "@component/ui/avatar";
import { TypographyH4, TypographyMuted } from "@component/ui/typography";

const DownloadItem: React.FC<QueueItem> = ({ type, metadata, size }) => {
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
            <TypographyMuted>
              {FileSizeFormat.si(size, { space: true })}
            </TypographyMuted>
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

export default DownloadItem;
