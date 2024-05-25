import { useQuery } from "@tanstack/react-query";
import { download_queue } from "@/lib/models/download_queue";
import { db } from "@/lib/system/commands";
import { KEY_DOWNLOAD_QUEUE } from "./keys";

export function useCurrentQueue() {
  return useQuery({
    queryKey: [KEY_DOWNLOAD_QUEUE, "CURRENT"],
    initialData: null,
    refetchInterval: 60_000,
    queryFn: () =>
      db
        .select({
          schema: download_queue.schema,
          query:
            "SELECT * FROM download_queue WHERE state = 'CURRENT' LIMIT 1;",
        })
        .then((e) => e.at(0) ?? null),
  });
}

export function useQueue(queue: string, order: "ASC" | "DESC" = "DESC") {
  return useQuery({
    queryKey: [KEY_DOWNLOAD_QUEUE, queue],
    refetchInterval: 60_000,
    queryFn: () =>
      db.select({
        schema: download_queue.schema,
        query: `SELECT * FROM download_queue WHERE state = ? AND display = TRUE ORDER BY install_order ${order};`,
        args: [queue],
      }),
  });
}
