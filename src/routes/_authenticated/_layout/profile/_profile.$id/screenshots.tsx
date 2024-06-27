import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import { convertFileSrc } from "@tauri-apps/api/tauri";
import { exists, readDir } from "@tauri-apps/api/fs";
import { join } from "@tauri-apps/api/path";
import { FileImage } from "lucide-react";
import { useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { settings } from "@/lib/models/settings";
import { Loading } from "@/components/Loading";

const profileScreenshotsQueryOptions = (id: string) => queryOptions({
  queryKey: ["PROFILE", id, "SCREENSHOTS"],
  queryFn: async () => {
    const paths = await settings.select("path.app");
    const path = paths.at(0)?.value;
    if (!path) throw new Error("Missing app directory");
    const screenshot_dir = await join(
      path,
      "profiles",
      id,
      "screenshots",
    );
    if (!(await exists(screenshot_dir))) return [];
    const entries = await readDir(screenshot_dir, { recursive: false });
    return entries.map((item) => convertFileSrc(item.path));
  }
});

export const Route = createFileRoute('/_authenticated/_layout/profile/_profile/$id/screenshots')({
  component: Screenshots,
  errorComponent: (error) => <ErrorComponent error={error} />,
  pendingComponent: Loading,
  loader: (opts) => opts.context.queryClient.ensureQueryData(profileScreenshotsQueryOptions(opts.params.id))
});

function Screenshots() {
  const container = useRef<HTMLDivElement>(null);
  const params = Route.useParams();
  const query = useSuspenseQuery(profileScreenshotsQueryOptions(params.id));
  const rowVirtualizer = useVirtualizer({
    count: query.data.length ?? 0,
    getScrollElement: () => container.current,
    estimateSize: () => 400,
    overscan: 5,
  });

  return (
    <div ref={container} className="h-full overflow-y-scroll">
      {query.data.length >= 1 ? (
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
                  <FileImage />
                </AvatarFallback>
                <AvatarImage src={query.data[virtualItem.index]} />
              </Avatar>
            </div>
          ))}
        </div>
      ) : (<div className="flex flex-col justify-center items-center h-full">No Screenshots!</div>)}
    </div>
  );
}