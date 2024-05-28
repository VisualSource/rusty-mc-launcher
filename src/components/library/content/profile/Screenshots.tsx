import { AlertTriangle, Image, LoaderCircle } from "lucide-react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { readDir, exists } from "@tauri-apps/api/fs";
import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { join } from "@tauri-apps/api/path";
import { useRef } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TypographyH3 } from "@/components/ui/typography";
import { MinecraftProfile } from "@/lib/models/profiles";
import { settings } from "@/lib/models/settings";

export const Screenshots: React.FC = () => {
  const ctx = useOutletContext() as MinecraftProfile;
  const container = useRef<HTMLDivElement>(null);
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["SCREENSHOTS", ctx.id],
    queryFn: async () => {
      const paths = await settings.select("path.app");
      const path = paths.at(0)?.value;
      if (!path) throw new Error("Missing app directory");

      const screenshot_dir = await join(
        path,
        "profiles",
        ctx.id,
        "screenshots",
      );

      if (!(await exists(screenshot_dir))) {
        return [];
      }

      const entries = await readDir(screenshot_dir, { recursive: false });

      return entries.map((item) => convertFileSrc(item.path));
    },
  });
  const rowVirtualizer = useVirtualizer({
    count: data?.length ?? 0,
    getScrollElement: () => container.current,
    estimateSize: () => 400,
    overscan: 5,
  });
  return (
    <div ref={container} className="h-full overflow-y-scroll">
      {isLoading ? (
        <div className="flex h-full w-full flex-col items-center justify-center">
          <div className="flex gap-2">
            <LoaderCircle className="animate-spin" />
            <pre>Loading Content</pre>
          </div>
        </div>
      ) : isError ? (
        <div className="flex h-full flex-col items-center justify-center text-zinc-50">
          <AlertTriangle />
          <TypographyH3>Something went wrong:</TypographyH3>
          <pre className="text-red-300">{error.message}</pre>
        </div>
      ) : (
        <div
          className="relative w-full"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => (
            <div
              key={virtualItem.key}
              className="absolute left-0 top-0 inline-flex w-full items-center gap-2"
              style={{
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              <Avatar className="my-2 aspect-square h-96 w-full rounded-md">
                <AvatarFallback className="rounded-md">
                  <Image />
                </AvatarFallback>
                <AvatarImage src={data?.[virtualItem.index]} />
              </Avatar>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
